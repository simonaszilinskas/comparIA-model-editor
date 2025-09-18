# Compar:IA Model Editor

Un éditeur visuel pour gérer et modifier les données de modèles d'IA avec une interface française intuitive.

## 🚀 Déploiement sur Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/simonaszilinskas/comparIA-model-editor)

### Déploiement automatique
1. Cliquez sur le bouton "Deploy with Vercel" ci-dessus
2. Connectez votre compte GitHub
3. Autorisez Vercel à accéder au repository
4. Le déploiement se fait automatiquement
5. Votre application sera disponible à l'URL fournie par Vercel

### Déploiement manuel
1. Fork ce repository
2. Connectez-vous à [Vercel](https://vercel.com)
3. Cliquez sur "New Project"
4. Importez votre fork GitHub
5. Vercel détectera automatiquement la configuration
6. Cliquez sur "Deploy"

## 📋 Fonctionnalités

- **Interface française complète** - Tous les textes en français
- **Import/Export JSON** - Importez vos données ou collez directement
- **Gestion des éditeurs** - Ajoutez, modifiez, supprimez des éditeurs de modèles
- **Édition de modèles** - Interface complète pour tous les champs
- **Export CSV** - Exportez vos données au format CSV
- **Validation en temps réel** - Compteurs de caractères et validation
- **Responsive design** - Fonctionne sur desktop et mobile

## 🛠️ Utilisation

1. **Importez vos données** - Utilisez "Importer fichier JSON" ou "Coller JSON"
2. **Gérez les éditeurs** - Ajoutez des entreprises/éditeurs de modèles
3. **Éditez les modèles** - Modifiez les informations de chaque modèle
4. **Exportez** - Récupérez vos données en JSON ou CSV

## 🔧 Développement local

```bash
# Cloner le repository
git clone https://github.com/simonaszilinskas/comparIA-model-editor.git
cd comparIA-model-editor

# Servir localement (avec n'importe quel serveur web)
python -m http.server 3000
# ou
npx serve .
# ou
php -S localhost:3000
```

Ouvrez http://localhost:3000 dans votre navigateur.

## 📁 Structure du projet

```
├── index.html          # Interface principale
├── script.js           # Logique de l'application
├── styles.css          # Styles et design responsive
├── vercel.json         # Configuration Vercel
└── README.md           # Documentation
```

## 🌐 Démo en ligne

Une fois déployé sur Vercel, votre application sera accessible via une URL comme :
`https://votre-projet.vercel.app`

## 📄 Licence

Ce projet a été généré avec [Claude Code](https://claude.ai/code).
