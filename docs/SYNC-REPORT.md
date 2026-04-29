# 📊 Rapport d'Analyse & Synchronisation — Care Connect

**Date** : 2026-02-27  
**Frontend** : React 18 + Vite + TailwindCSS + shadcn/ui  
**Backend** : Laravel 10+ + PostgreSQL + Sanctum

---

## Résumé Exécutif

| Aspect | Statut | Détail |
|--------|--------|--------|
| **Backend (Laravel)** | ✅ Complet | Tous les contrôleurs, routes, services et jobs définis dans `docs/laravel-backend/` |
| **Frontend (React)** | 🟡 Partiellement connecté | Les fichiers `src/api/*.ts` existent et sont corrects, mais **aucune page ne les utilise** — tout passe par `mockApi` |
| **Communication** | 🔴 Non fonctionnelle | Le frontend utilise 100% de données mock, jamais le vrai backend |
| **Problèmes critiques** | **3** | Mock partout, réponse API non unwrappée, pas de toggle mock/réel |

---

## 1. ANALYSE BACKEND

### 1.1 Contrôleurs présents (dans `docs/laravel-backend/`)

| Contrôleur | Statut | Méthodes |
|---|---|---|
| `AuthController.php` | ✅ Complet | `login`, `register`, `me`, `updateProfile`, `updatePassword`, `logout` |
| `DashboardController.php` | ✅ Complet | `patient`, `doctor`, `secretary`, `admin`, `stats` |
| `AppointmentController.php` | ✅ Complet | `index`, `store`, `show`, `update`, `destroy`, `updateStatus`, `availableSlots`, `upcoming`, `today` |
| `DoctorController.php` | ✅ Complet | `index`, `show`, `availabilities`, `schedule`, `patients`, `stats`, `storeAvailability`, `updateAvailability`, `destroyAvailability`, `addNotes` |
| `PatientController.php` | ✅ Complet | `appointments`, `medicalHistory`, `updateProfile` |
| `SecretaryController.php` | ✅ Complet | `assignedDoctors`, `schedule`, `patients`, `createAppointment` |
| `NotificationController.php` | ✅ Complet | `index`, `unreadCount`, `markAsRead`, `markAllAsRead`, `destroy`, `updatePreferences` |
| `UserController.php` | ✅ Complet | `index`, `store`, `show`, `update`, `destroy`, `toggleActive` |

### 1.2 Routes API (40 routes)

| Catégorie | Routes | Auth | Middleware |
|---|---|---|---|
| **Publiques** | 5 (`login`, `register`, `doctors`, `doctors/{id}`, `doctors/{id}/availabilities`) | ❌ | — |
| **Auth** | 4 (`logout`, `me`, `me` PUT, `me/password`) | ✅ | `auth:sanctum` |
| **Dashboard** | 5 | ✅ | `auth:sanctum` |
| **Appointments** | 9 | ✅ | `auth:sanctum` |
| **Doctor** | 7 | ✅ | `auth:sanctum` + `role:doctor` |
| **Patient** | 3 | ✅ | `auth:sanctum` + `role:patient` |
| **Secretary** | 4 | ✅ | `auth:sanctum` + `role:secretary` |
| **Notifications** | 6 | ✅ | `auth:sanctum` |
| **Admin** | 6 | ✅ | `auth:sanctum` + `role:admin` |

### 1.3 Configuration

| Fichier | Statut |
|---|---|
| `config/cors.php` | ✅ Origines `localhost:3000`, `5173`, `5174` autorisées, `supports_credentials: true` |
| `config/services.php` | ✅ Twilio, Firebase, Pusher configurés |
| `CheckRole` middleware | ✅ Supporte multi-rôles |

### 1.4 Format de réponse JSON

```json
// ✅ Succès
{ "success": true, "message": "...", "data": { ... } }

// ❌ Erreur
{ "success": false, "message": "...", "error_code": "CODE", "errors": { ... } }
```

---

## 2. ANALYSE FRONTEND

### 2.1 Structure des fichiers API

| Fichier | Statut | Contenu |
|---|---|---|
| `src/api/client.ts` | ✅ Parfait | Base URL `localhost:8000/api`, intercepteur token Bearer, redirect 401 |
| `src/api/auth.ts` | ✅ Correct | `login`, `register`, `me`, `logout` |
| `src/api/appointments.ts` | ✅ Correct | `list`, `get`, `create`, `update`, `cancel`, `updateStatus`, `availableSlots`, `upcoming`, `today` |
| `src/api/dashboard.ts` | ✅ Correct | `patient`, `doctor`, `secretary`, `admin`, `stats` |
| `src/api/doctors.ts` | ✅ Correct | `list`, `get`, `availabilities`, `addAvailability`, `stats` |
| `src/api/notifications.ts` | ✅ Correct | `list`, `unreadCount`, `markAsRead`, `markAllAsRead` |

### 2.2 Pages et routes frontend

| Route | Page | API Mock utilisée | API réelle correspondante |
|---|---|---|---|
| `/login` | `Login.tsx` | `mockAuthApi.login()` via AuthContext | `authApi.login()` |
| `/register` | `Register.tsx` | `mockAuthApi.register()` via AuthContext | `authApi.register()` |
| `/patient` | `patient/Dashboard.tsx` | `mockDashboardApi.patient()` | `dashboardApi.patient()` |
| `/patient/doctors` | `patient/DoctorsList.tsx` | `mockDoctorsApi.list()` | `doctorsApi.list()` |
| `/patient/book` | `patient/BookAppointment.tsx` | `mockDoctorsApi` + `mockAppointmentsApi` | `doctorsApi` + `appointmentsApi` |
| `/patient/appointments` | `patient/MyAppointments.tsx` | `mockAppointmentsApi.list()` | `appointmentsApi.list()` |
| `/doctor` | `doctor/Dashboard.tsx` | `mockDashboardApi.doctor()` | `dashboardApi.doctor()` |
| `/doctor/schedule` | `doctor/SchedulePage.tsx` | `mockAppointments` (import direct) | `appointmentsApi` |
| `/doctor/patients` | `doctor/PatientsPage.tsx` | Mock direct | `doctorsApi` |
| `/doctor/availabilities` | `doctor/AvailabilitiesPage.tsx` | Mock direct | `doctorsApi` |
| `/doctor/stats` | `doctor/StatsPage.tsx` | Mock direct | `dashboardApi.stats()` |
| `/secretary` | `secretary/Dashboard.tsx` | `mockDashboardApi.secretary()` | `dashboardApi.secretary()` |
| `/secretary/appointments` | `secretary/AppointmentsPage.tsx` | Mock direct | `appointmentsApi` |
| `/secretary/schedule` | `secretary/SchedulePage.tsx` | Mock direct | `appointmentsApi` |
| `/secretary/patients` | `secretary/PatientsPage.tsx` | Mock direct | API secretary |
| `/admin` | `admin/Dashboard.tsx` | `mockDashboardApi.admin()` | `dashboardApi.admin()` |
| `/admin/users` | `admin/UsersPage.tsx` | Mock direct | API admin users |
| `/admin/appointments` | `admin/AppointmentsPage.tsx` | Mock direct | `appointmentsApi` |
| `/admin/stats` | `admin/StatsPage.tsx` | Mock direct | `dashboardApi.stats()` |
| `/notifications` | `NotificationsPage.tsx` | `mockNotificationsApi` | `notificationsApi` |
| `/settings` | `SettingsPage.tsx` | Mock direct (`mockUsers`, `updateUser`) | `authApi.me()` + `PUT /me` |
| `/profile` | `ProfilePage.tsx` | Mock direct (`mockProfiles`) | `authApi.me()` + `PUT /me` |

---

## 3. PROBLÈMES IDENTIFIÉS

### 🔴 Critiques (3)

| # | Problème | Impact | Fichiers concernés |
|---|---|---|---|
| 1 | **100% des pages utilisent des mocks** | Le backend est complètement ignoré | Toutes les pages dans `src/pages/` |
| 2 | **AuthContext utilise `mockAuthApi`** | Login/Register ne communiquent jamais avec Laravel | `src/contexts/AuthContext.tsx` |
| 3 | **Les API wrappers ne gèrent pas `{success, data}`** | Quand on switch au vrai backend, `response.data` retourne `{success, data}` et non les données directement | `src/api/*.ts` |

### 🟡 Moyens (4)

| # | Problème | Impact |
|---|---|---|
| 4 | Pas de variable d'env `VITE_USE_MOCK` pour toggler mock/réel | Difficile de tester le backend sans modifier du code |
| 5 | `SchedulePage.tsx`, `ProfilePage.tsx`, `SettingsPage.tsx` importent `mockData` directement (pas via mockApi) | Couplage fort aux mocks |
| 6 | Les API wrappers frontend ne gèrent pas la pagination (`meta`) | Pages admin/secrétaire sans pagination |
| 7 | `notificationsApi` manque `delete()` — le backend a `destroy` | Impossible de supprimer une notification via l'API réelle |

### 🟢 Améliorations (3)

| # | Amélioration |
|---|---|
| 8 | Ajouter des types TypeScript pour les réponses dashboard (actuellement `Record<string, any>`) |
| 9 | Centraliser les labels de statut/type dans un fichier partagé (dupliqués dans 6+ fichiers) |
| 10 | Ajouter `react-query` pour le cache et le refetch automatique des données API |

---

## 4. CORRESPONDANCE ENDPOINTS BACKEND ↔ FRONTEND

### 4.1 Endpoints publics

| Backend | Méthode | Frontend API | Frontend Page | Statut |
|---|---|---|---|---|
| `/api/login` | POST | `authApi.login()` | `/login` | 🔴 Page utilise mock |
| `/api/register` | POST | `authApi.register()` | `/register` | 🔴 Page utilise mock |
| `/api/doctors` | GET | `doctorsApi.list()` | `/patient/doctors` | 🔴 Page utilise mock |
| `/api/doctors/{id}` | GET | `doctorsApi.get()` | `/patient/book` | 🔴 Page utilise mock |
| `/api/doctors/{id}/availabilities` | GET | `doctorsApi.availabilities()` | — | ✅ Prêt |

### 4.2 Dashboard

| Backend | Frontend API | Frontend Page | Statut |
|---|---|---|---|
| `GET /api/dashboard/patient` | `dashboardApi.patient()` | `/patient` | 🔴 Mock — réponse backend ≠ structure mock |
| `GET /api/dashboard/doctor` | `dashboardApi.doctor()` | `/doctor` | 🔴 Mock — réponse backend ≠ structure mock |
| `GET /api/dashboard/secretary` | `dashboardApi.secretary()` | `/secretary` | 🔴 Mock |
| `GET /api/dashboard/admin` | `dashboardApi.admin()` | `/admin` | 🔴 Mock |
| `GET /api/dashboard/stats` | `dashboardApi.stats()` | Stats pages | 🔴 Mock |

### 4.3 Rendez-vous

| Backend | Frontend API | Statut |
|---|---|---|
| `GET /api/appointments` | `appointmentsApi.list()` | 🔴 Mock |
| `POST /api/appointments` | `appointmentsApi.create()` | 🔴 Mock |
| `GET /api/appointments/{id}` | `appointmentsApi.get()` | ✅ Prêt |
| `PUT /api/appointments/{id}` | `appointmentsApi.update()` | ✅ Prêt |
| `DELETE /api/appointments/{id}` | `appointmentsApi.cancel()` | 🔴 Mock |
| `PATCH /api/appointments/{id}/status` | `appointmentsApi.updateStatus()` | ✅ Prêt |
| `GET /api/appointments/available-slots` | `appointmentsApi.availableSlots()` | 🔴 Mock |
| `GET /api/appointments/upcoming` | `appointmentsApi.upcoming()` | 🔴 Mock |
| `GET /api/appointments/today` | `appointmentsApi.today()` | 🔴 Mock |

### 4.4 Notifications

| Backend | Frontend API | Statut |
|---|---|---|
| `GET /api/notifications` | `notificationsApi.list()` | 🔴 Mock |
| `GET /api/notifications/unread-count` | `notificationsApi.unreadCount()` | 🔴 Mock |
| `POST /api/notifications/{id}/read` | `notificationsApi.markAsRead()` | 🔴 Mock |
| `POST /api/notifications/read-all` | `notificationsApi.markAllAsRead()` | 🔴 Mock |
| `DELETE /api/notifications/{id}` | ❌ **Manquant** | 🔴 Non implémenté dans `src/api/notifications.ts` |
| `PUT /api/notifications/preferences` | ❌ **Manquant** | 🔴 Non implémenté |

### 4.5 Endpoints sans wrapper frontend

| Backend | Méthode | Frontend API | Action requise |
|---|---|---|---|
| `POST /api/doctor/availabilities` | POST | ❌ Manquant | Créer dans `doctorsApi` |
| `PUT /api/doctor/availabilities/{id}` | PUT | ❌ Manquant | Créer dans `doctorsApi` |
| `DELETE /api/doctor/availabilities/{id}` | DELETE | ❌ Manquant | Créer dans `doctorsApi` |
| `POST /api/doctor/appointments/{id}/notes` | POST | ❌ Manquant | Créer dans `appointmentsApi` ou `doctorsApi` |
| `GET /api/patient/medical-history` | GET | ❌ Manquant | Créer `patientApi` |
| `PUT /api/patient/profile` | PUT | ❌ Manquant | Créer `patientApi` |
| `GET /api/secretary/doctors` | GET | ❌ Manquant | Créer `secretaryApi` |
| `GET /api/secretary/schedule` | GET | ❌ Manquant | Créer `secretaryApi` |
| `GET /api/secretary/patients` | GET | ❌ Manquant | Créer `secretaryApi` |
| `POST /api/secretary/appointments` | POST | ❌ Manquant | Créer `secretaryApi` |
| `GET /api/admin/users` | GET | ❌ Manquant | Créer `adminApi` |
| `POST /api/admin/users` | POST | ❌ Manquant | Créer `adminApi` |
| `PUT /api/admin/users/{id}` | PUT | ❌ Manquant | Créer `adminApi` |
| `DELETE /api/admin/users/{id}` | DELETE | ❌ Manquant | Créer `adminApi` |
| `PATCH /api/admin/users/{id}/toggle-active` | PATCH | ❌ Manquant | Créer `adminApi` |
| `DELETE /api/notifications/{id}` | DELETE | ❌ Manquant | Ajouter à `notificationsApi` |
| `PUT /api/notifications/preferences` | PUT | ❌ Manquant | Ajouter à `notificationsApi` |

---

## 5. DIFFÉRENCES DE STRUCTURE MOCK vs BACKEND

### Dashboard Patient

| Champ Mock | Champ Backend | Compatible ? |
|---|---|---|
| `total_appointments` | `statistics.total_appointments` | 🟡 Nested différemment |
| `upcoming_appointments` (nombre) | `statistics.upcoming` | 🟡 Nom différent |
| `completed_appointments` | `statistics.completed` | 🟡 Nested |
| `next_appointment` | `next_appointment` | ✅ |
| `upcoming` (array) | `upcoming_appointments` (array) | 🟡 Nom différent |
| `recent_completed` | `recent_history` | 🟡 Nom différent |
| `monthly_data` | ❌ Non retourné par le backend | 🔴 Manquant |

### Dashboard Doctor

| Champ Mock | Champ Backend | Compatible ? |
|---|---|---|
| `today_count` | `today_stats.total` | 🟡 Nested |
| `today_appointments` | `today_appointments` | ✅ |
| `weekly_data` | ❌ Non retourné | 🔴 Manquant |
| `patients_list` | ❌ Non retourné | 🔴 Manquant |
| `completion_rate` | ❌ Non retourné | 🔴 Manquant |

> **Impact** : Quand le frontend bascule sur le vrai backend, les pages dashboard vont afficher des données vides/undefined car la structure est différente.

---

## 6. PLAN D'ACTION (Priorité)

### Phase 1 : Infrastructure de bascule (immédiate)

1. ✅ Ajouter `VITE_USE_MOCK=true` dans `.env` pour toggler mock/réel
2. ✅ Mettre à jour `AuthContext.tsx` pour utiliser `authApi` quand `VITE_USE_MOCK=false`
3. ✅ Créer un wrapper `apiResponse()` qui unwrap `{success, data}` automatiquement

### Phase 2 : Compléter les wrappers API manquants

4. Créer `src/api/patients.ts` (medical-history, profile)
5. Créer `src/api/secretary.ts` (doctors, schedule, patients, appointments)
6. Créer `src/api/admin.ts` (users CRUD, toggle-active)
7. Compléter `src/api/notifications.ts` (delete, preferences)
8. Compléter `src/api/doctors.ts` (availability CRUD, notes)

### Phase 3 : Adapter les pages

9. Remplacer `mockDashboardApi` par `dashboardApi` dans chaque Dashboard
10. Adapter les pages pour gérer la structure `{success, data}` du backend
11. Ajouter une couche d'adaptation pour les différences de noms de champs

### Phase 4 : Alignement backend (côté Laravel)

12. Ajouter `monthly_data`, `weekly_data`, `patients_list`, `completion_rate` aux contrôleurs dashboard
13. Ajouter la pagination aux endpoints de liste

---

## 7. GUIDE DE TEST MANUEL

### 7.1 Tester l'authentification

```bash
# Backend
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@medical.com","password":"password"}'

# Réponse attendue
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "token": "1|abc...",
    "user": { "id": 1, "email": "patient@medical.com", "role": "patient", ... }
  }
}
```

### 7.2 Tester un endpoint protégé

```bash
# Récupérer le dashboard patient
curl -X GET http://localhost:8000/api/dashboard/patient \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Accept: application/json"
```

### 7.3 Frontend

1. Mettre `VITE_USE_MOCK=false` dans `.env`
2. Lancer le backend : `cd backEnd-careConnect && php artisan serve`
3. Lancer le frontend : `cd care-connect && npm run dev`
4. Se connecter avec `patient@medical.com` / `password`
5. Vérifier dans DevTools > Network que les requêtes vont vers `localhost:8000`

---

## 8. CHECKLIST DE CONFORMITÉ

### Backend ✅

- [x] Format JSON standardisé `{success, message, data}`
- [x] Validation avec messages en français
- [x] Middleware `auth:sanctum` sur routes protégées
- [x] Middleware `role` pour les permissions
- [x] CORS configuré pour `localhost:3000/5173/5174`
- [x] Eager loading dans les contrôleurs
- [x] Codes HTTP appropriés (200, 201, 401, 403, 404, 422)

### Frontend 🟡

- [x] `src/api/client.ts` : Base URL, intercepteur token, redirect 401
- [x] Fichiers API wrappers existent
- [ ] ❌ Les pages utilisent les mocks au lieu des vraies API
- [ ] ❌ Pas de gestion du format `{success, data}` dans les wrappers
- [ ] ❌ Wrappers manquants pour 17 endpoints
- [ ] ❌ Pas de variable d'env pour toggler mock/réel
