node {
    /*******************************************************
     * STAGE 1: Remote Checkout Code (On EC2)
     *******************************************************/
    stage('Remote: Checkout Code') {
        sshagent(['52.91.67.244']) {
            sh """
                ssh -o StrictHostKeyChecking=no ubuntu@52.91.67.244 << 'EOF'
                  
                  # 1. Install git if it's not installed
                  sudo -S apt-get update -y <<< ""
                  sudo -S apt-get install -y git <<< ""

                  # 2. Clone repo if not exists, otherwise pull latest code
                  if [ ! -d "/home/ubuntu/k8s-ci-cd-workflow" ]; then
                    git clone https://github.com/hyphenperator/k8s-ci-cd-workflow.git /home/ubuntu/k8s-ci-cd-workflow
                  else
                    cd /home/ubuntu/k8s-ci-cd-workflow
                    git pull origin main
                  fi

                  exit
                EOF
            """
        }
    }

    /*******************************************************
     * STAGE 2: Install Dependencies (Node.js, Nginx, pm2)
     *******************************************************/
    stage('Remote: Install Dependencies') {
        sshagent(['52.91.67.244']) {
            sh """
                ssh -o StrictHostKeyChecking=no ubuntu@52.91.67.244 << 'EOF'

                  # 1. Install Node.js, npm, nginx, and PM2
                  sudo -S apt-get update -y <<< ""
                  sudo -S apt-get install -y nodejs npm nginx <<< ""
                  
                  # Install PM2 globally
                  sudo -S npm install -g pm2 <<< ""

                  exit
                EOF
            """
        }
    }

    /*******************************************************
     * STAGE 3: Build & Test the Node.js App (On Remote EC2)
     *******************************************************/
    stage('Remote: Build & Test') {
        sshagent(['52.91.67.244']) {
            sh """
                ssh -o StrictHostKeyChecking=no ubuntu@52.91.67.244 << 'EOF'

                  # 1. Navigate to the Node.js app folder
                  cd /home/ubuntu/k8s-ci-cd-workflow/my-node-app

                  # 2. Install Node dependencies
                  npm install

                  # 3. Run tests (comment out if you don’t have tests)
                  npm test || true

                  exit
                EOF
            """
        }
    }

    /*******************************************************
     * STAGE 4: Configure Nginx & Deploy App
     *******************************************************/
    stage('Remote: Configure Nginx & Deploy') {
        sshagent(['52.91.67.244']) {
            sh """
                ssh -o StrictHostKeyChecking=no ubuntu@52.91.67.244 << 'EOF'

                  # 1. Navigate to the Node.js app folder
                  cd /home/ubuntu/k8s-ci-cd-workflow/my-node-app

                  # 2. Ensure dependencies are installed
                  npm install

                  # 3. Start or restart the app using PM2 (listens on port 3000)
                  pm2 stop my-node-app || true
                  pm2 start app.js --name my-node-app

                  # 4. Configure Nginx to proxy traffic from port 80 to 127.0.0.1:3000
                  sudo -S rm -f /etc/nginx/sites-enabled/default <<< ""

                  sudo -S bash -c 'cat > /etc/nginx/sites-available/my-node-app << NGINX_CONF
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
NGINX_CONF'

                  sudo -S ln -sf /etc/nginx/sites-available/my-node-app /etc/nginx/sites-enabled/my-node-app <<< ""
                  sudo -S systemctl restart nginx <<< ""

                  exit
                EOF
            """
        }
    }
}
