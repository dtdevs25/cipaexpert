import * as Minio from 'minio';
import path from 'path';

export class StorageService {
  private static client: Minio.Client | null = null;
  private static bucketInitialized = false;

  private static getClient(): Minio.Client | null {
    if (this.client) return this.client;

    const endpointRaw = process.env.MINIO_ENDPOINT || '';
    const accessKey = process.env.MINIO_ACCESS_KEY || '';
    const secretKey = process.env.MINIO_SECRET_KEY || '';

    if (!endpointRaw || !accessKey || !secretKey) {
      console.warn('⚠️ [STORAGE] MinIO não configurado completamente no ambiente (MINIO_ENDPOINT, MINIO_ACCESS_KEY ou MINIO_SECRET_KEY ausentes).');
      return null;
    }

    // Limpa protocolo caso o usuário tenha informado com http:// ou https://
    const endpointClean = endpointRaw.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const useSSL = process.env.MINIO_USE_SSL === 'true' || endpointRaw.startsWith('https://');
    let port = process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT, 10) : (useSSL ? 443 : 9000);

    // Se o host já tiver porta embutida (ex: minio.com:9000)
    const hostParts = endpointClean.split(':');
    let finalHost = hostParts[0];
    if (hostParts.length > 1) {
      finalHost = hostParts[0];
      port = parseInt(hostParts[1], 10);
    }

    try {
      this.client = new Minio.Client({
        endPoint: finalHost,
        port: port,
        useSSL: useSSL,
        accessKey: accessKey,
        secretKey: secretKey
      });
      console.log(`📦 [STORAGE] Cliente MinIO inicializado: ${finalHost}:${port} (SSL: ${useSSL})`);
      return this.client;
    } catch (err) {
      console.error('❌ [STORAGE] Erro ao instanciar Minio.Client:', err);
      return null;
    }
  }

  public static getPhotoBucket(): string {
    return process.env.MINIO_BUCKET_PHOTOS || 
           process.env.MINIO_BUCKET_FOTOS || 
           process.env.MINIO_BUCKET_NAME || 
           'fotos';
  }

  public static async ensureBucket(bucketName: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;

    try {
      const exists = await client.bucketExists(bucketName);
      if (!exists) {
        console.log(`📦 [STORAGE] Criando bucket '${bucketName}' no MinIO...`);
        await client.makeBucket(bucketName, 'us-east-1');
        
        // Define política pública de leitura para visualização das fotos
        const publicReadPolicy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucketName}/*`]
            }
          ]
        };
        try {
          await client.setBucketPolicy(bucketName, JSON.stringify(publicReadPolicy));
          console.log(`🔓 [STORAGE] Política de leitura pública aplicada ao bucket '${bucketName}'.`);
        } catch (policyErr) {
          console.warn(`⚠️ [STORAGE] Aviso ao definir política no bucket:`, policyErr);
        }
      }
      this.bucketInitialized = true;
      return true;
    } catch (err) {
      console.error(`❌ [STORAGE] Erro ao verificar/criar bucket '${bucketName}':`, err);
      return false;
    }
  }

  /**
   * Faz upload de imagem (colaborador, empresa ou usuário) no bucket do MinIO
   * Retorna a URL final acessível pelo navegador
   */
  public static async uploadPhoto(
    id: string,
    fileBuffer: Buffer,
    mimeType: string = 'image/jpeg',
    originalFilename: string = 'foto.jpg',
    folder: string = 'usuarios'
  ): Promise<string> {
    const client = this.getClient();
    const bucket = this.getPhotoBucket();

    // Extensão limpa
    const extMatch = originalFilename.match(/\.[0-9a-z]+$/i);
    const ext = extMatch ? extMatch[0].toLowerCase() : (mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : '.jpg');
    const prefix = folder === 'empresas' ? 'logo' : folder === 'colaboradores' ? 'colab' : 'avatar';
    const objectName = `${folder}/${prefix}-${id}-${Date.now()}${ext}`;

    if (client) {
      await this.ensureBucket(bucket);

      const metaData = {
        'Content-Type': mimeType,
        'x-amz-meta-id': id,
        'x-amz-meta-folder': folder
      };

      console.log(`📤 [STORAGE] Enviando imagem (${folder}) para o MinIO: ${bucket}/${objectName} (${fileBuffer.length} bytes)...`);
      await client.putObject(bucket, objectName, fileBuffer, fileBuffer.length, metaData);
      console.log(`✅ [STORAGE] Imagem gravada no MinIO com sucesso!`);

      // Se houver MINIO_PUBLIC_URL explícita, usa ela
      if (process.env.MINIO_PUBLIC_URL) {
        const publicBase = process.env.MINIO_PUBLIC_URL.replace(/\/$/, '');
        return `${publicBase}/${bucket}/${objectName}`;
      }

      // Rota proxy do próprio servidor (funciona perfeitamente mesmo em rede interna Docker/CapRover)
      return `/api/storage/${bucket}/${objectName}`;
    }

    // Se MinIO não estiver conectado, retorna como data URI para não perder a foto do usuário
    console.warn(`⚠️ [STORAGE] MinIO indisponível no momento. Salvando imagem em fallback.`);
    return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
  }

  /**
   * Recupera o arquivo do MinIO para streaming via API (proxy seguro)
   */
  public static async getFileStream(bucket: string, objectName: string) {
    const client = this.getClient();
    if (!client) throw new Error('Serviço de storage MinIO não inicializado.');
    return await client.getObject(bucket, objectName);
  }

  public static async getFileStat(bucket: string, objectName: string) {
    const client = this.getClient();
    if (!client) throw new Error('Serviço de storage MinIO não inicializado.');
    return await client.statObject(bucket, objectName);
  }
}
