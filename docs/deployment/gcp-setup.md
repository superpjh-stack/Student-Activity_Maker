# GCP 배포 설정 가이드

Student Activity Maker를 Google Cloud Platform에 배포하기 위한 단계별 설정 가이드입니다.

## 사전 요구사항

- Google Cloud SDK (`gcloud`) 설치 및 인증 완료
- GCP 프로젝트 생성 완료
- OpenAI API 키 보유

```bash
# 프로젝트 설정
export PROJECT_ID=your-project-id
gcloud config set project $PROJECT_ID
```

## 1. API 활성화

필요한 GCP API를 활성화합니다.

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

## 2. Artifact Registry 저장소 생성

Docker 이미지를 저장할 저장소를 생성합니다.

```bash
gcloud artifacts repositories create student-activity-maker \
  --repository-format=docker \
  --location=asia-northeast3 \
  --description="Student Activity Maker Docker images"
```

## 3. Secret Manager에 OPENAI_API_KEY 등록

OpenAI API 키를 Secret Manager에 안전하게 저장합니다.

```bash
echo -n "your-openai-api-key" | gcloud secrets create OPENAI_API_KEY \
  --replication-policy="automatic" \
  --data-file=-
```

키 값을 업데이트해야 할 경우:

```bash
echo -n "new-openai-api-key" | gcloud secrets versions add OPENAI_API_KEY \
  --data-file=-
```

## 4. Cloud Build 서비스 계정 IAM 권한 설정

Cloud Build 서비스 계정에 필요한 역할을 부여합니다.

```bash
# 프로젝트 번호 확인
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Cloud Build 서비스 계정
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Cloud Run 관리자 권한
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/run.admin"

# 서비스 계정 사용자 권한 (Cloud Run 배포 시 필요)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/iam.serviceAccountUser"

# Artifact Registry 관리자 권한
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/artifactregistry.admin"

# Secret Manager 접근 권한
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/secretmanager.secretAccessor"
```

## 5. Cloud Build 트리거 생성 (GitHub 연결)

### 5-1. GitHub 저장소 연결

```bash
# GitHub 연결 생성 (브라우저에서 인증 진행)
gcloud builds connections create github \
  --region=asia-northeast3 \
  --name=github-connection
```

> GitHub 연결은 GCP Console > Cloud Build > 저장소에서 UI로 진행하는 것이 더 편리합니다.

### 5-2. 빌드 트리거 생성

```bash
gcloud builds triggers create github \
  --region=asia-northeast3 \
  --name="student-activity-maker-deploy" \
  --repository="projects/${PROJECT_ID}/locations/asia-northeast3/connections/github-connection/repositories/Student-Activity-Maker" \
  --branch-pattern="^master$" \
  --build-config="cloudbuild.yaml" \
  --description="master 브랜치 푸시 시 자동 배포"
```

## 6. 첫 배포 테스트

### 수동 빌드 실행

```bash
gcloud builds submit \
  --region=asia-northeast3 \
  --config=cloudbuild.yaml
```

### 빌드 로그 확인

```bash
gcloud builds list --region=asia-northeast3 --limit=5
gcloud builds log <BUILD_ID> --region=asia-northeast3
```

### Cloud Run 서비스 상태 확인

```bash
gcloud run services describe student-activity-maker \
  --region=asia-northeast3 \
  --format="value(status.url)"
```

### 서비스 URL 접속 테스트

```bash
SERVICE_URL=$(gcloud run services describe student-activity-maker \
  --region=asia-northeast3 \
  --format="value(status.url)")

curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL
```

정상 배포 시 `200` 응답이 반환됩니다.
