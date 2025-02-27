node {
    /*******************************************************
     * STAGE 1: Install Node & npm on Jenkins (Host Machine)
     * -----------------------------------------------------
     * Ensures Jenkins can run "npm install" or "npm test" 
     * locally. If you prefer Docker-based builds, you can 
     * remove this stage and use a Docker image with Node 
     * pre-installed instead.
     *******************************************************/
    stage('Install Node on Jenkins') {
        sh '''
          # Update and install Node.js + npm if not already installed
          # (For Debian/Ubuntu-based systems)
          sudo apt-get update -y
          sudo apt-get install -y nodejs npm || true
          node -v || true
          npm -v || true
        '''
    }

    /*******************************************************
     * STAGE 2: Checkout Code
     *******************************************************/
    stage('Checkout') {
        // Pull the entire repo from GitHub
        git branch: 'main',
            url: 'https://github.com/hyphenperator/k8s-ci-cd-workflow.git'
    }
    
    /*******************************************************
     * STAGE 3: Build/Test Node App
     *******************************************************/
    stage('Build/Test') {
        // Enter the my-node-app folder for build & test
        dir('my-node-app') {
            sh 'npm install'
            // Run tests if your project has them; comment out if you don’t
            sh 'npm test'
        }
    }
    
    /*******************************************************
     * STAGE 4: Deploy to EC2 (Install Node, pm2, Nginx,
     *           clone or pull code, run the Node app)
     *******************************************************/
    stage('Deploy') {
        // Use your SSH key stored in Jenkins (ID: 52.91.67.244)
        sshagent(credentials: ['52.91.67.244']) {
            sh """
                # SSH into the EC2 instance; skip host key checking
                ssh -o StrictHostKeyChecking=no ubuntu@52.91.67.244 << 'EOF'
                  
                  # 1. System prep on EC2
                  sudo apt-get update -y
                  sudo apt-get install -y nodejs npm git nginx
                  
                  # Install PM2 globally
                  sudo npm install -g pm2

                  # 2. Clone or update the repo on EC2
                  if [ ! -d "/home/ubuntu/my-node-app" ]; then
                    # First-time clone
                    git clone https://github.com/hyphenperator/k8s-ci-cd-workflow.git /home/ubuntu/temp-repo
                    mv /home/ubuntu/temp-repo/my-node-app /home/ubuntu/my-node-app
                    rm -rf /home/ubuntu/temp-repo
                  else
                    cd /home/ubuntu/my-node-app
                    git pull origin main
                  fi

                  # 3. Install app dependencies
                  cd /home/ubuntu/my-node-app
                  npm install

                  # 4. Start or restart via PM2 (assuming app.js runs on port 3000)
                  pm2 stop my-node-app || true
                  pm2 start app.js --name my-node-app

                  # 5. Configure Nginx -> reverse proxy port 80 to 127.0.0.1:3000
                  # Remove default site
                  sudo rm -f /etc/nginx/sites-enabled/default
                  
                  # Create a new site config
                  sudo bash -c 'cat > /etc/nginx/sites-available/my-node-app << NGX_CONF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \\$host;
    }
}
NGX_CONF'

                  # Symlink and restart Nginx
                  sudo ln -sf /etc/nginx/sites-available/my-node-app /etc/nginx/sites-enabled/my-node-app
                  sudo systemctl restart nginx

                  # 6. Exit
                  exit
                EOF
            """
        }
    }
}
