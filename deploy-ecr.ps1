# deploy-ecr.ps1 — builds Docker image, pushes to ECR, creates App Runner service
# Run from: C:\Users\User\fastbuysell-whatsapp

$REGION      = "us-east-1"
$ACCOUNT_ID  = "751702759480"
$REPO_NAME   = "outreachhq"
$SERVICE_NAME = "OutReachhq"
$ECR_URI     = "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME"

$NEXT_PUBLIC_SUPABASE_URL      = "https://txzktkbhcesmenhdubsi.supabase.co"
$NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4emt0a2JoY2VzbWVuaGR1YnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NTE3MTksImV4cCI6MjA5NjQyNzcxOX0.l3q1GzenmwyFUYV37JDV1wFgZIWn2vbAZoujhNNvnJg"
$NEXT_PUBLIC_APP_URL           = "https://rwpmy4ab2u.us-east-1.awsapprunner.com"

Write-Host ">>> Step 1: Create ECR repo (ignore error if exists)" -ForegroundColor Cyan
aws ecr create-repository --repository-name $REPO_NAME --region $REGION 2>$null

Write-Host ">>> Step 2: Docker login to ECR" -ForegroundColor Cyan
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

Write-Host ">>> Step 3: Build image" -ForegroundColor Cyan
docker build `
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL `
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY `
  --build-arg NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL `
  -t "${REPO_NAME}:latest" .

Write-Host ">>> Step 4: Tag and push to ECR" -ForegroundColor Cyan
docker tag "${REPO_NAME}:latest" "${ECR_URI}:latest"
docker push "${ECR_URI}:latest"

Write-Host ">>> Step 5: Delete old failed App Runner service (if exists)" -ForegroundColor Cyan
aws apprunner delete-service `
  --service-arn "arn:aws:apprunner:${REGION}:${ACCOUNT_ID}:service/OutReachhq/97b06dd8f1bb48c688868b09c793e9b2" `
  --region $REGION 2>$null

Write-Host ">>> Waiting 10s for deletion..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ">>> Step 6: Create App Runner service from ECR image" -ForegroundColor Cyan
aws apprunner create-service --cli-input-json file://apprunner-ecr.json --region $REGION

Write-Host ">>> Done! Check: https://console.aws.amazon.com/apprunner" -ForegroundColor Green
