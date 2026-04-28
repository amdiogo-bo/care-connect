# 🔧 PROMPT : ANALYSE ET CORRECTION CARE CONNECT
## Faire fonctionner Frontend + Backend ensemble

---

## 🎯 OBJECTIF

Analyse mon projet **Care Connect** (frontend + backend) et corrige TOUS les problèmes pour que les deux communiquent parfaitement.

---

## 📦 MON PROJET

**Structure :**
```
Platform-rv-medical/
├── care-connect/              # Frontend (React/Vue)
│   └── Tourne sur http://localhost:3000 ou :5173
│
└── backEnd-careConnect/       # Backend Laravel
    └── Tourne sur http://localhost:8000
```

**Repositories GitHub :**
- Frontend : `https://github.com/amdiogo-bo/care-connect.git`
- Backend : `https://github.com/amdiogo-bo/care-connect-api.git`

**Stack :**
- Frontend : React/Vue + TypeScript + Tailwind + Axios
- Backend : Laravel 10 + PostgreSQL + Sanctum
- Communication : API REST JSON

---

## 🔍 CE QUE TU DOIS FAIRE

### 1️⃣ ANALYSER LE FRONTEND

Vérifie dans `care-connect/` :

**Configuration API**
- ✅ Fichier `.env` : `VITE_API_URL=http://localhost:8000/api`
- ✅ Configuration Axios : `baseURL`, `headers`, `withCredentials`
- ✅ Intercepteurs : token Bearer, gestion erreurs 401/403/422/500
- ✅ Service API : appels vers les bons endpoints

**Pages et composants**
- ✅ Login : envoie `email` + `password`, reçoit `token` + `user`
- ✅ Register : envoie tous les champs requis
- ✅ Dashboard : récupère les stats selon le rôle
- ✅ Liste docteurs : affiche `GET /api/doctors`
- ✅ Prise de RDV : envoie `POST /api/appointments`
- ✅ Mes RDV : affiche `GET /api/appointments`

**Gestion authentification**
- ✅ Stockage token : localStorage ou cookies
- ✅ Header `Authorization: Bearer {token}` sur chaque requête
- ✅ Redirection si token expiré
- ✅ Logout : appelle `POST /api/logout`

---

### 2️⃣ ANALYSER LE BACKEND

Vérifie dans `backEnd-careConnect/` :

**Configuration**
- ✅ `.env` : `DB_CONNECTION=pgsql`, `DB_HOST`, `DB_PORT=5432`, etc.
- ✅ `config/cors.php` : autorise `localhost:3000` et `localhost:5173`
- ✅ `config/sanctum.php` : `stateful_domains` configurés
- ✅ `bootstrap/app.php` : middleware Sanctum activé

**Routes API (`routes/api.php`)**
- ✅ Routes publiques : `/login`, `/register`, `/doctors`
- ✅ Routes protégées avec `auth:sanctum`
- ✅ Routes par rôle avec middleware `role:patient|doctor|admin`

**Controllers**
- ✅ `AuthController` : login, register, logout, me
- ✅ `DoctorController` : CRUD docteurs + disponibilités
- ✅ `AppointmentController` : CRUD RDV + confirm/cancel
- ✅ `PatientController` : profil, historique
- ✅ `DashboardController` : stats par rôle

**Models et Migrations**
- ✅ Tables : `users`, `doctors`, `patients`, `secretaries`, `appointments`, `availabilities`, `notifications`
- ✅ Relations Eloquent : `hasOne`, `hasMany`, `belongsTo`
- ✅ Foreign keys avec `onDelete('cascade')`

**Format de réponse JSON standardisé**
```json
{
  "success": true,
  "message": "Opération réussie",
  "data": { ... }
}
```

**Validation (FormRequest)**
- ✅ Règles de validation pour chaque endpoint
- ✅ Messages d'erreur en français
- ✅ Retour 422 avec détails des erreurs

---

### 3️⃣ VÉRIFIER LA COMMUNICATION

**Tests à effectuer :**
1. Login depuis le frontend → vérifier token reçu
2. Liste docteurs → vérifier données affichées
3. Création RDV → vérifier sauvegarde en DB
4. CORS → pas d'erreur dans la console
5. Token expiré → redirection vers login
6. Validation → erreurs 422 affichées correctement

---

### 4️⃣ CORRIGER LES PROBLÈMES

Pour CHAQUE problème trouvé :
1. ✅ **Identifier** le problème précisément
2. ✅ **Expliquer** pourquoi c'est un problème
3. ✅ **Fournir** le code de correction COMPLET
4. ✅ **Indiquer** dans quel fichier le mettre
5. ✅ **Tester** que la correction fonctionne

---

## 📋 CHECKLIST DE VÉRIFICATION

### Frontend
- [ ] `.env` avec `VITE_API_URL` correct
- [ ] Axios configuré avec `baseURL` et intercepteurs
- [ ] Token stocké et envoyé dans les headers
- [ ] Gestion des erreurs 401/403/422/500
- [ ] Toutes les pages utilisent les bons endpoints
- [ ] Formulaires envoient les bons champs
- [ ] Loading states et messages d'erreur

### Backend
- [ ] PostgreSQL configuré et migrations exécutées
- [ ] CORS autorise le frontend
- [ ] Sanctum configuré pour API tokens
- [ ] Toutes les routes définies dans `api.php`
- [ ] Controllers retournent JSON standardisé
- [ ] Validation avec FormRequest
- [ ] Middleware de rôles fonctionnel
- [ ] Seeders avec données de test

### Communication
- [ ] Login fonctionne (token reçu)
- [ ] Requêtes authentifiées passent
- [ ] CORS sans erreur
- [ ] Format des dates cohérent (`YYYY-MM-DD`, `HH:MM`)
- [ ] Réponses JSON identiques attendu/reçu
- [ ] Erreurs gérées des deux côtés

---

## 🛠️ COMMANDES DE TEST

```bash
# Backend
cd backEnd-careConnect
composer install
php artisan migrate:fresh --seed
php artisan serve

# Frontend
cd care-connect
npm install
npm run dev

# Test API direct
curl http://localhost:8000/api/doctors
```

---

## 🚀 COMMENCE MAINTENANT

Analyse mon projet Care Connect et :

1. ✅ Liste TOUS les problèmes trouvés
2. ✅ Génère le code de correction COMPLET (pas de "...")
3. ✅ Fournis un plan d'action étape par étape
4. ✅ Crée un guide de test pour vérifier que tout fonctionne

**Sois exhaustif, précis et fournis du code production-ready !** 🎯
