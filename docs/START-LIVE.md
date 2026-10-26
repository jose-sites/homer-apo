# Uso diário: abrir a live e iniciar Homer

Uma única vez, preencha o `.env` local com `AI_API_KEY` (ou `OPENAI_API_KEY`), `FISH_API_KEY`, `FISH_REFERENCE_ID_HOMER` da voz autorizada escolhida, `TTS_PRIMARY=fish`, `TTS_SECONDARY=openai`, `TIKTOK_ENABLED=true` e `TIKTOK_USERNAME`. Para a voz secundária, informe `TTS_API_KEY` ou `OPENAI_API_KEY`. Reinicie após editar. Não envie esse arquivo ao GitHub.

Depois:

1. Execute `iniciar-homer.bat` e abra o sistema.
2. Abra a live no TikTok.
3. Em Configurações, clique **Iniciar conversa ao vivo**.

O clique libera o áudio nesta janela, conecta o TikTok e seleciona IA externa, modo automático e voz do servidor (Fish principal). Não precisa selecionar esses modos a cada sessão. A conexão e as credenciais precisam funcionar; preenchimento não comprova validade, saldo ou acesso à voz. Nenhuma fala paga é gerada como teste de inicialização.

Se faltar configuração, o sistema lista os campos e não troca silenciosamente para demonstração. A sequência de fallback existente permanece: Fish, secundário configurado, navegador como último recurso; alternativas podem ter outro timbre, informado no diagnóstico de áudio. Não há voz oficial embutida.

O botão não abre uma live no TikTok, não dispensa a configuração inicial e não implementa reconexão automática. O conector é comunitário e pode exigir acesso ao serviço de assinatura. Mantenha áudio em apenas uma janela para evitar eco. Navegadores exigem interação para liberar som, por isso existe o clique inicial.
