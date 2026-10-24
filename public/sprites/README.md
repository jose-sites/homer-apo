# Substituição de sprites

Os cinco personagens atuais usam desenhos vetoriais 2.5D gerados localmente, redesenhados com cinco expressões, piscadas e boca animada. Não são modelos 3D nem animações oficiais. O arquivo `src/scene/spriteArt.ts` é a fonte; `npx tsx scripts/export-sprites.ts` atualiza os SVGs estáticos usados nos avatares.

Para substituir um personagem, adicione imagens transparentes de proporção 300×420 a esta pasta e edite `manifest.json`:

```json
{
  "characters": {
    "homer": {
      "front": "/sprites/homer-final.png",
      "left": "/sprites/homer-esquerda.png",
      "right": "/sprites/homer-direita.png",
      "frames": {
        "front": {
          "closed": "/sprites/homer-final.png",
          "half": "/sprites/homer-boca-media.png",
          "open": "/sprites/homer-boca-aberta.png",
          "blink": "/sprites/homer-piscando.png"
        }
      }
    }
  }
}
```

`front` é obrigatório. Os ângulos `left`, `right`, `profile` e `back` são opcionais; os estados da boca e piscada também. Sem frames, a imagem fornecida permanece estática, com respiração leve. Sem imagens de perfil/traseira, ângulos incompatíveis ocultam o sprite. Uma imagem ausente mantém o desenho provisório. Apenas caminhos locais com `/` inicial são aceitos. Reinicie/recarregue o navegador após editar o manifesto. Use apenas artes que você tem autorização para transmitir.
