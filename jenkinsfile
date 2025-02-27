node {
    stage('Checkout') {
        // Pull the entire repo from GitHub
        git branch: 'main', url: 'https://github.com/hyphenperator/k8s-ci-cd-workflow.git'
    }

    stage('Build/Test') {
        // Move into the "my-node-app" directory for build/test
        dir('my-node-app') {
            sh 'npm install'
            sh 'npm test'  // Remove/adjust if you don't have tests
        }
    }

    stage('Deploy') {
        // Use the SSH key stored in Jenkins credentials (ID: 52.91.67.244)
        sshagent(['52.91.67.244']) {
            sh """
                # SSH into the EC2 instance; skip host key checking
                ssh -o StrictHostKeyChecking=no ubuntu@52.91.67.244 << EOF

                  # 1. Basic system prep: install Node.js, npm, git, and nginx
                  sudo apt-get update -y
                  sudo apt-get install -y nodejs npm git nginx
                  sudo npm install -g pm2

                  # 2. Ensure we have the latest code for 'my-node-app'
                  if [ ! -d "/home/ubuntu/my-node-app" ]; then
                    # Clone the repo the first time; then move only the 'my-node-app' folder into place
                    git clone https://github.com/hyphenperator/k8s-ci-cd-workflow.git /home/ubuntu/temp-repo
                    mv /home/ubuntu/temp-repo/my-node-app /home/ubuntu/my-node-app
                    rm -rf /home/ubuntu/temp-repo
                  else
                    cd /home/ubuntu/my-node-app
                    git pull origin main
                  fi

                  # 3. Install dependencies for the Node app
                  cd /home/ubuntu/my-node-app
                  npm install

                  # 4. Start/restart the Node app with PM2 on port 3000
                  #    (Assumes 'app.js' listens on port 3000)
                  pm2 stop my-node-app || true
                  pm2 start app.js --name my-node-app

                  # 5. Configure Nginx (reverse proxy -> localhost:3000)
                  #    Remove default config
                  sudo rm -f /etc/nginx/sites-enabled/default

                  #    Create a new Nginx config for 'my-node-app'
                  sudo bash -c 'cat > /etc/nginx/sites-available/my-node-app << NGINX_CONF
server {
    listen 80;
    server_name _;  # or your domain/IP

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \\$host;
    }
}
NGINX_CONF'

                  #    Symlink and restart Nginx
                  sudo ln -sf /etc/nginx/sites-available/my-node-app /etc/nginx/sites-enabled/my-node-app
                  sudo systemctl restart nginx

                  # 6. Exit SSH
                  exit
                EOF
            """
        }
    }
}
