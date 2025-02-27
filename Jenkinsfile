node {
    stage('Remote: Checkout Code') {
        sshagent(['52.91.67.244']) {
            sh """
                ssh -o StrictHostKeyChecking=no ubuntu@52.91.67.244 << 'EOF'
                
                  # 1. Install git if it's not installed
                  sudo apt-get update -y
                  sudo apt-get install -y git

                  # 2. If the repo folder doesn't exist, clone it. Otherwise, pull changes.
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

    stage('Remote: Install Dependencies (Node, Nginx, pm2)') {
        sshagent(['52.91.67.244']) {
            sh """
                ssh -o StrictHostKeyChecking=no ubuntu@52.91.67.244 << 'EOF'
                
                  # 1. Update system, install Node.js, npm, nginx, etc.
                  sudo apt-get update -y
                  sudo apt-get install -y nodejs npm nginx

                  # 2. Install PM2 globally
                  sudo npm install -g pm2

                  exit
                EOF
            """
        }
    }

    stage('Remote: Build & Test') {
        sshagent(['52.91.67.244']) {
            sh """
                ssh -o StrictHostKeyChecking=no ubuntu@52.91.67.244 << 'EOF'

                  # 1. Go to your Node.js folder. 
                  #    The Node app is in 'my-node-app' subfolder of the repo, adjust path if needed.
                  cd /home/ubuntu/k8s-ci-cd-workflow/my-node-app

                  # 2. Install Node dependencies
                  npm install

                  # 3. Run tests (comment out if you have no tests)
                  npm test || true

                  exit
                EOF
            """
        }
    }

    stage('Remote: Configure Nginx & Deploy') {
        sshagent(['52.91.67.244']) {
            sh """
                ssh -o StrictHostKeyChecking=no ubuntu@52.91.67.244 << 'EOF'

                  # 1. Go to the Node app folder
                  cd /home/ubuntu/k8s-ci-cd-workflow/my-node-app

                  # 2. Make sure dependencies are installed (in case not done in previous step)
                  npm install

                  # 3. Start or restart the app on port 3000 using PM2
                  pm2 stop my-node-app || true
                  pm2 start app.js --name my-node-app

                  # 4. Configure Nginx reverse proxy from port 80 -> 127.0.0.1:3000
                  sudo rm -f /etc/nginx/sites-enabled/default

                  sudo bash -c 'cat > /etc/nginx/sites-available/my-node-app << NGINX_CONF
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

                  sudo ln -sf /etc/nginx/sites-available/my-node-app /etc/nginx/sites-enabled/my-node-app
                  sudo systemctl restart nginx

                  exit
                EOF
            """
        }
    }
}
