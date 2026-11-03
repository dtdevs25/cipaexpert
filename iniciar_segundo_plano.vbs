' ==============================================================================
' CIPA Expert - Inicializador em Segundo Plano (Background Service)
' Executa o servidor Node.js silenciosamente sem abrir janela de prompt,
' permitindo ao usuário utilizar o notebook livremente para qualquer outra tarefa.
' ==============================================================================

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

' Obter diretório atual do script
CurrentDirectory = FSO.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = CurrentDirectory

' Verificar se o build dist/server.js existe, senão compila
If Not FSO.FileExists(CurrentDirectory & "\dist\server.js") Then
    WshShell.Run "cmd /c npm run build", 0, True
End If

' Iniciar o servidor Node.js em modo totalmente invisível (0 = Janela Oculta)
WshShell.Run "cmd /c node dist/server.js", 0, False

' Aguardar 2.5 segundos para o servidor subir na porta 3000
WScript.Sleep 2500

' Abrir a plataforma no navegador padrão do notebook
WshShell.Run "http://localhost:3000", 1, False

' Notificar o usuário
WshShell.Popup "O CIPA Expert está em execução em segundo plano!" & vbCrLf & _
               "Acesse: http://localhost:3000" & vbCrLf & vbCrLf & _
               "Você pode usar o notebook normalmente. Para encerrar o serviço, execute 'parar_segundo_plano.bat'.", _
               5, "CIPA Expert - Ativo em Segundo Plano", 64
