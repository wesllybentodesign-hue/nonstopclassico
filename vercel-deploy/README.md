# NONSTOP CLÁSSICO DOTA 2

Site de pré-inscrição para o evento.

## Deploy no Vercel via GitHub

### 1. Crie um repositório no GitHub
- Vá em github.com → New repository
- Nome: `nonstop-dota2` (ou o que quiser)
- Deixe **privado ou público** — ambos funcionam no Vercel free

### 2. Suba os arquivos
```bash
git init
git add .
git commit -m "feat: site nonstop dota 2"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/nonstop-dota2.git
git push -u origin main
```

### 3. Deploy no Vercel
- Acesse vercel.com e faça login com o GitHub
- Clique em **"Add New Project"**
- Selecione o repositório `nonstop-dota2`
- Configurações (já detecta automaticamente via vercel.json):
  - **Build Command:** `npm run build`
  - **Output Directory:** `dist`
- Clique em **Deploy**

Pronto! O site estará online em poucos minutos.

## Desenvolvimento local
```bash
npm install
npm run dev
```
