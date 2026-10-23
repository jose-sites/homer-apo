# Recuperação do projeto — 23/10/2026

O executor anterior ficou indisponível e o workspace novo estava vazio. Nenhum arquivo original foi apagado ou sobrescrito durante esta retomada. Os arquivos-fonte conhecidos foram recuperados dos comandos de escrita e patches presentes no histórico da conversa, preservando a estrutura anterior.

Não existe backup verificável do disco anterior ou hashes originais para comprovar igualdade byte a byte. Formatação incidental pode variar. O package-lock.json precisou ser regenerado a partir do package.json original. node_modules, estado SQLite, caches e outros arquivos gerados do ambiente anterior não foram recuperados. Não afirmar que esta recuperação é uma cópia integral do disco anterior.

Os inventários dos três módulos estão nesta pasta. O restante recuperado pelo agente principal inclui package.json, tsconfig.json, vite.config.ts, index.html, .gitignore, shared/types.ts, src/main.tsx, src/store.ts, src/App.tsx, src/styles.css, src/components/{common,ChatPanel,CameraPanel,CharacterPanel,EventPanel,GamePanel,AudioPanel,MemoryPanel,SettingsPanel}.tsx, src/audio/{queue.ts,AudioDirector.ts,useAudio.ts}, tests/audio.test.ts.

O commit inicial representa a base recuperada antes de novas correções. Atualizações posteriores devem ser registradas separadamente. Uma cópia externa dos fontes e um Git bundle são preparados para download. Backups no mesmo executor não substituem baixar uma cópia ou enviar ao GitHub.
