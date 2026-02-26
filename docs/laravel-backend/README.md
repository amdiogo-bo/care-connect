# 🚀 Backend Laravel — Care Connect

## Structure des fichiers à copier

Copiez chaque fichier dans votre projet `backEnd-careConnect/` en respectant les chemins :

```
backEnd-careConnect/
├── config/
│   ├── cors.php                    ← Configuration CORS
│   └── services.php                ← Twilio, Firebase, Pusher
├── routes/
│   └── api.php                     ← Toutes les routes API
├── app/
│   ├── Http/
│   │   ├── Middleware/
│   │   │   └── CheckRole.php       ← Middleware de vérification de rôle
│   │   └── Controllers/Api/
│   │       ├── AuthController.php
│   │       ├── DashboardController.php
│   │       ├── AppointmentController.php
│   │       ├── DoctorController.php
│   │       ├── PatientController.php
│   │       ├── SecretaryController.php
│   │       ├── NotificationController.php
│   │       └── UserController.php
│   ├── Services/
│   │   └── NotificationService.php
│   └── Jobs/
│       ├── SendEmailNotification.php
│       ├── SendSMSNotification.php
│       ├── SendPushNotification.php
│       └── SendAppointmentReminders.php
```

## Installation rapide

```bash
cd backEnd-careConnect

# 1. Copier les fichiers ci-dessus

# 2. Installer les dépendances
composer require laravel/sanctum
composer require firebase/php-jwt  # Pour les push notifications

# 3. Configurer le .env (voir le prompt pour les valeurs)

# 4. Créer la base PostgreSQL
psql -U postgres -c "CREATE DATABASE care_connect_db WITH ENCODING 'UTF8';"

# 5. Lancer les migrations + seeders
php artisan migrate --seed

# 6. Démarrer le serveur
php artisan serve  # → http://localhost:8000

# 7. Démarrer les queues (pour les notifications)
php artisan queue:work --queue=notifications
```

## Planifier les rappels

Ajouter dans `routes/console.php` (Laravel 11) :

```php
use Illuminate\Support\Facades\Schedule;
use App\Jobs\SendAppointmentReminders;

Schedule::job(new SendAppointmentReminders)->everyFifteenMinutes();
```

Puis lancer : `php artisan schedule:work`

## Endpoints API

### Public (sans auth)
| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/api/login` | Connexion |
| POST | `/api/register` | Inscription (patient) |
| GET | `/api/doctors` | Liste docteurs |
| GET | `/api/doctors/{id}` | Détails docteur |
| GET | `/api/doctors/{id}/availabilities` | Disponibilités |

### Authentifié (Bearer token)
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/me` | Profil |
| PUT | `/api/me` | Modifier profil |
| PUT | `/api/me/password` | Changer mot de passe |
| POST | `/api/logout` | Déconnexion |

### Dashboard
| GET | `/api/dashboard/patient` | Dashboard patient |
| GET | `/api/dashboard/doctor` | Dashboard docteur |
| GET | `/api/dashboard/secretary` | Dashboard secrétaire |
| GET | `/api/dashboard/admin` | Dashboard admin |
| GET | `/api/dashboard/stats` | Stats filtrées |

### Rendez-vous
| GET | `/api/appointments` | Liste (filtrée par rôle) |
| POST | `/api/appointments` | Créer |
| GET | `/api/appointments/{id}` | Détails |
| PUT | `/api/appointments/{id}` | Modifier |
| DELETE | `/api/appointments/{id}` | Annuler |
| PATCH | `/api/appointments/{id}/status` | Changer statut |
| GET | `/api/appointments/available-slots` | Créneaux libres |
| GET | `/api/appointments/upcoming` | À venir |
| GET | `/api/appointments/today` | Aujourd'hui |

### Notifications
| GET | `/api/notifications` | Liste |
| GET | `/api/notifications/unread-count` | Non lues |
| POST | `/api/notifications/{id}/read` | Marquer lue |
| POST | `/api/notifications/read-all` | Tout marquer lu |
| DELETE | `/api/notifications/{id}` | Supprimer |
| PUT | `/api/notifications/preferences` | Préférences |

### Docteur (role: doctor)
| GET | `/api/doctor/schedule` | Planning |
| GET | `/api/doctor/patients` | Mes patients |
| GET | `/api/doctor/stats` | Statistiques |
| POST | `/api/doctor/availabilities` | Ajouter dispo |
| PUT | `/api/doctor/availabilities/{id}` | Modifier dispo |
| DELETE | `/api/doctor/availabilities/{id}` | Supprimer dispo |
| POST | `/api/doctor/appointments/{id}/notes` | Ajouter notes |

### Patient (role: patient)
| GET | `/api/patient/appointments` | Mes RDV |
| GET | `/api/patient/medical-history` | Historique médical |
| PUT | `/api/patient/profile` | Profil médical |

### Secrétaire (role: secretary)
| GET | `/api/secretary/doctors` | Docteurs assignés |
| GET | `/api/secretary/schedule` | Planning multi-docteurs |
| GET | `/api/secretary/patients` | Patients |
| POST | `/api/secretary/appointments` | Créer RDV |

### Admin (role: admin)
| GET | `/api/admin/users` | Liste utilisateurs |
| POST | `/api/admin/users` | Créer utilisateur |
| GET | `/api/admin/users/{id}` | Détails |
| PUT | `/api/admin/users/{id}` | Modifier |
| DELETE | `/api/admin/users/{id}` | Supprimer |
| PATCH | `/api/admin/users/{id}/toggle-active` | Activer/Désactiver |

## Connexion frontend

Le frontend (`care-connect/`) est déjà configuré avec `src/api/client.ts` qui pointe vers `http://localhost:8000/api`. Assurez-vous que le backend tourne sur ce port.

Pour basculer du mock au vrai backend, remplacez les imports `mockApi` par les vrais appels API dans les pages.
