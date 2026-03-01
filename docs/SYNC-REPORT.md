# 📊 Rapport de Synchronisation — Care Connect

> **Date** : 2026-03-01  
> **Frontend** : React + Vite + TailwindCSS (port 5173)  
> **Backend** : Laravel 10+ + PostgreSQL (port 8000)  
> **Auth** : Laravel Sanctum (Bearer tokens)

---

## 1. Résumé Exécutif

| Élément | Statut | Détails |
|---------|--------|---------|
| **Configuration API (client.ts)** | ✅ OK | Base URL `http://127.0.0.1:8000/api`, intercepteurs token + 401 |
| **Authentification** | ✅ OK | Login/Register/Logout fonctionnels via API réelle |
| **Wrappers API** | ✅ OK | 8 fichiers (`auth`, `appointments`, `dashboard`, `doctors`, `notifications`, `patients`, `secretary`, `admin`) |
| **Pages utilisant l'API réelle** | ⚠️ 5/22 → **22/22** | Toutes les pages migrées avec toggle mock/API |
| **Toggle Mock/API** | ✅ Implémenté | Variable `VITE_USE_MOCK` (défaut: mock activé) |
| **CORS Backend** | ✅ Configuré | `localhost:3000`, `:5173`, `:5174` autorisés |

---

## 2. Pages Migrées — Source de Données

### 2.1 Pages déjà sur API réelle ✅

| Page | Fichier | API Wrapper | Endpoint Backend |
|------|---------|-------------|------------------|
| Login | `pages/auth/Login.tsx` | `authApi.login()` | `POST /api/login-simple` |
| Register | `pages/auth/Register.tsx` | `authApi.register()` | `POST /api/register-simple` |
| Liste médecins | `pages/patient/DoctorsList.tsx` | `doctorsApi.list()` | `GET /api/doctors` |
| Prise de RDV | `pages/patient/BookAppointment.tsx` | `doctorsApi + appointmentsApi` | Multiples |
| Mes RDV | `pages/patient/MyAppointments.tsx` | `appointmentsApi` | `GET/DELETE /api/appointments-simple` |

### 2.2 Pages migrées avec toggle mock/API 🔄

| Page | Fichier | Mock → API |
|------|---------|-----------|
| Dashboard Patient | `pages/patient/Dashboard.tsx` | `mockDashboardApi` → `dashboardApi.patient()` |
| Dashboard Docteur | `pages/doctor/Dashboard.tsx` | `mockDashboardApi` → `dashboardApi.doctor()` |
| Dashboard Secrétaire | `pages/secretary/Dashboard.tsx` | `mockDashboardApi` → `dashboardApi.secretary()` |
| Dashboard Admin | `pages/admin/Dashboard.tsx` | `mockDashboardApi` → `dashboardApi.admin()` |
| Planning Docteur | `pages/doctor/SchedulePage.tsx` | `mockAppointments` → `doctorsApi.schedule()` |
| Patients Docteur | `pages/doctor/PatientsPage.tsx` | `mockAppointments+Users` → `doctorsApi.patients()` |
| Stats Docteur | `pages/doctor/StatsPage.tsx` | `mockAppointments` → `doctorsApi.stats()` |
| Disponibilités | `pages/doctor/AvailabilitiesPage.tsx` | local state → `doctorsApi.availabilities/add/update/delete` |
| RDV Secrétaire | `pages/secretary/AppointmentsPage.tsx` | `mockData` → `appointmentsApi + secretaryApi` |
| Planning Secrétaire | `pages/secretary/SchedulePage.tsx` | `mockData` → `secretaryApi.schedule()` |
| Patients Secrétaire | `pages/secretary/PatientsPage.tsx` | `mockData` → `secretaryApi.patients()` |
| Utilisateurs Admin | `pages/admin/UsersPage.tsx` | `mockUsers` → `adminApi` |
| RDV Admin | `pages/admin/AppointmentsPage.tsx` | `mockAppointments` → `appointmentsApi.list()` |
| Stats Admin | `pages/admin/StatsPage.tsx` | `mockData` → `dashboardApi.stats()` |
| Notifications | `pages/notifications/NotificationsPage.tsx` | `mockNotificationsApi` → `notificationsApi` |
| Profil | `pages/profile/ProfilePage.tsx` | `mockProfiles` → `authApi + patientApi` |
| Paramètres | `pages/settings/SettingsPage.tsx` | `mockData` → `authApi + notificationsApi` |

---

## 3. Mapping Complet Frontend ↔ Backend

### 3.1 Authentification

| Action | Endpoint | Frontend | Statut |
|--------|----------|----------|--------|
| Login | `POST /api/login-simple` | `authApi.login()` | ✅ |
| Register | `POST /api/register-simple` | `authApi.register()` | ✅ |
| Profil | `GET /api/me-simple` | `authApi.me()` | ✅ |
| Update profil | `PUT /api/me` | `authApi.updateProfile()` | ✅ |
| Changer MDP | `PUT /api/me/password` | `authApi.updatePassword()` | ✅ |
| Logout | `POST /api/logout-simple` | `authApi.logout()` | ✅ |

### 3.2 Dashboards

| Endpoint | Frontend | Rôle requis |
|----------|----------|-------------|
| `GET /api/dashboard/patient` | `dashboardApi.patient()` | patient |
| `GET /api/dashboard/doctor` | `dashboardApi.doctor()` | doctor |
| `GET /api/dashboard/secretary` | `dashboardApi.secretary()` | secretary |
| `GET /api/dashboard/admin` | `dashboardApi.admin()` | admin |
| `GET /api/dashboard/stats` | `dashboardApi.stats()` | admin |

### 3.3 Rendez-vous

| Endpoint | Frontend | Auth |
|----------|----------|------|
| `GET /api/appointments-simple` | `appointmentsApi.list()` | ✅ |
| `GET /api/appointments/{id}` | `appointmentsApi.get(id)` | ✅ |
| `POST /api/appointments-simple` | `appointmentsApi.create()` | ✅ |
| `PUT /api/appointments/{id}` | `appointmentsApi.update()` | ✅ |
| `DELETE /api/appointments/{id}` | `appointmentsApi.cancel()` | ✅ |
| `PATCH /api/appointments/{id}/status` | `appointmentsApi.updateStatus()` | ✅ |
| `GET /api/appointments/available-slots` | `appointmentsApi.availableSlots()` | ✅ |
| `GET /api/appointments/upcoming` | `appointmentsApi.upcoming()` | ✅ |
| `GET /api/appointments/today` | `appointmentsApi.today()` | ✅ |

### 3.4 Médecins

| Endpoint | Frontend | Auth |
|----------|----------|------|
| `GET /api/doctors` | `doctorsApi.list()` | public |
| `GET /api/doctors/{id}` | `doctorsApi.get(id)` | public |
| `GET /api/doctors/{id}/availabilities` | `doctorsApi.availabilities(id)` | public |
| `GET /api/doctor/schedule` | `doctorsApi.schedule()` | doctor |
| `GET /api/doctor/patients` | `doctorsApi.patients()` | doctor |
| `GET /api/doctor/stats` | `doctorsApi.stats()` | doctor |
| `POST /api/doctor/availabilities` | `doctorsApi.addAvailability()` | doctor |
| `PUT /api/doctor/availabilities/{id}` | `doctorsApi.updateAvailability()` | doctor |
| `DELETE /api/doctor/availabilities/{id}` | `doctorsApi.deleteAvailability()` | doctor |

### 3.5 Secrétaire / Admin / Notifications

| Endpoint | Frontend |
|----------|----------|
| `GET /api/secretary/doctors` | `secretaryApi.assignedDoctors()` |
| `GET /api/secretary/schedule` | `secretaryApi.schedule()` |
| `GET /api/secretary/patients` | `secretaryApi.patients()` |
| `POST /api/secretary/appointments` | `secretaryApi.createAppointment()` |
| `GET /api/admin/users` | `adminApi.listUsers()` |
| `POST /api/admin/users` | `adminApi.createUser()` |
| `PUT /api/admin/users/{id}` | `adminApi.updateUser()` |
| `DELETE /api/admin/users/{id}` | `adminApi.deleteUser()` |
| `GET /api/notifications` | `notificationsApi.list()` |
| `POST /api/notifications/{id}/read` | `notificationsApi.markAsRead()` |
| `POST /api/notifications/read-all` | `notificationsApi.markAllAsRead()` |
| `DELETE /api/notifications/{id}` | `notificationsApi.delete()` |

---

## 4. Guide de Démarrage Rapide

### Backend
```bash
cd backEnd-careConnect
composer install
cp .env.example .env
# Éditer .env → PostgreSQL + CORS
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### Frontend — Mode Mock (défaut)
```bash
cd care-connect
npm install
npm run dev
# Fonctionne sans backend, données simulées
```

### Frontend — Mode API Réelle
```bash
# Dans .env :
VITE_API_URL=http://127.0.0.1:8000/api
VITE_USE_MOCK=false

npm run dev
```

### Tests manuels
```bash
# 1. Login
curl -s -X POST http://localhost:8000/api/login-simple \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@medical.com","password":"password"}'

# 2. Dashboard (avec token)
TOKEN="votre_token_ici"
curl -s http://localhost:8000/api/dashboard/patient \
  -H "Authorization: Bearer $TOKEN"

# 3. Liste médecins (public)
curl -s http://localhost:8000/api/doctors
```

---

## 5. `.env` Backend Requis

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=care_connect_db

FRONTEND_URL=http://localhost:5173
SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost:5173,127.0.0.1:3000,127.0.0.1:5173
```

## 6. `config/cors.php` Backend Requis

```php
'allowed_origins' => [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'supports_credentials' => true,
```
