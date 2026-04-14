# 🚀 Beginner's Guide: Deploying R-Choice Internship Portal

> A step-by-step, easy-to-understand guide for deploying the InternFlow (R-Choice) platform for the college. 
> 
> **Scenario:** The college provides an empty cloud server, a fresh PostgreSQL database, and wants to link the portal to the main college website (e.g., as a subdomain like `internships.rathinam.edu.in`).

---

## Phase 1: Database Setup 🗄️

The portal requires a **PostgreSQL** database. The college IT team should provide you with a "Connection String" (or Database URL) that looks something like this:
`postgresql://username:password@database-host.com:5432/database_name`

### Step-by-Step Data Setup:
1. Open the provided `database/schema.sql` file.
2. Run this entirely on the new college database (using a tool like `pgAdmin`, `DBeaver`, or standard `psql` command line).
3. *Result:* Your database now has all 28 tables required for the platform.

---

## Phase 2: Preparing the Server 💻

You will receive access to a Linux Cloud Server (usually Ubuntu). Use SSH to access it.

### Step 1: Install Required Software
Run these simple commands one by one to install what's needed:

```bash
# 1. Update the server to latest software packages
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js (The engine that runs our app)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2 (Keeps the app running 24/7 even if you close the terminal)
sudo npm install -g pm2

# 4. Install Nginx (The web server that connects the domain to our app)
sudo apt install nginx -y
```

### Step 2: Get the Code
Download our code onto the server:

```bash
# Go to the web apps folder
cd /var/www

# Clone (download) the repository
sudo git clone https://github.com/iamharishrohith/R-Choice.git internflow

# Go into the folder
cd internflow

# Give your user permission to edit files
sudo chown -R $USER:$USER /var/www/internflow
```

---

## Phase 3: Configuration & Launch ⚙️

### Step 1: Install Code Dependencies
Inside the `internflow` folder, run:
```bash
npm install
```

### Step 2: Connect the Database and Secrets
We need to tell the app where the new Database is. Create a secret file:
```bash
nano .env.local
```

Paste this inside, changing the values to match the college's details:
```env
# 1. Paste the College's Database URL here:
DATABASE_URL=postgresql://username:password@college-host:5432/dbname

# 2. Generate a random password for NextAuth (you can type anything random here, just make it long)
AUTH_SECRET=a_very_long_random_secret_string_for_security

# 3. The final web address the portal will live at:
NEXTAUTH_URL=https://internships.rathinam.edu.in
```
*(Press `Ctrl+X`, then `Y`, then `Enter` to save the file).*

### Step 3: Build and Start!
```bash
# 1. Build the project for live production 
npm run build

# 2. Start the app using PM2 so it stays alive forever
pm2 start npm --name "internflow" -- start

# 3. Save PM2 settings so it starts automatically if the server reboots
pm2 save
pm2 startup
```

---

## Phase 4: Connecting the Domain Name 🌍

We want the portal to be accessible clearly via the college website, for example, a subdomain: `internships.rathinam.edu.in`.

### Step 1: Domain Mapping (DNS)
1. The college IT team needs to log into their Domain Provider (GoDaddy, AWS Route53, HostGator, etc.).
2. They must add an **A Record** pointing the name `internships` to the **IP Address of your Cloud Server**.

### Step 2: Linking your Server to the Domain
Now, tell your server to listen for that specific domain name using Nginx.

```bash
sudo nano /etc/nginx/sites-available/internflow
```

Paste this configuration:
```nginx
server {
    listen 80;
    
    # Change this to whatever branch/subdomain the college chose
    server_name internships.rathinam.edu.in; 

    location / {
        proxy_pass http://localhost:3000; # Our Next.js app
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the website:
```bash
sudo ln -s /etc/nginx/sites-available/internflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### ✅ ALL DONE! 
You can now visit `http://internships.rathinam.edu.in` and the portal will be live!

*(Note: Ask the IT team to run `certbot` to secure the website with HTTPS/SSL afterwards).*
