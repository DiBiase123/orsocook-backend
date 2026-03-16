#!/bin/bash

echo "🔍 Inizio rinomina file e aggiornamento import..."

# 1. Rinomina i file
echo "📁 Rinomino i file..."

# Recipe files
mv src/controllers/recipe/recipe.helpers.ts src/controllers/recipe/recipe_helpers.ts 2>/dev/null
mv src/controllers/recipe/recipe.queries.ts src/controllers/recipe/recipe_queries.ts 2>/dev/null
mv src/controllers/recipe/recipe.validators.ts src/controllers/recipe/recipe_validators.ts 2>/dev/null

# Service files
mv src/services/session.service.ts src/services/session_service.ts 2>/dev/null
mv src/services/user/user.service.ts src/services/user/user_service.ts 2>/dev/null
mv src/services/email/email.service.ts src/services/email/email_service.ts 2>/dev/null

# Controller files
mv src/controllers/recipe/comment.controller.ts src/controllers/recipe/comment_controller.ts 2>/dev/null
mv src/controllers/recipe/image.controller.ts src/controllers/recipe/image_controller.ts 2>/dev/null
mv src/controllers/recipe/like.controller.ts src/controllers/recipe/like_controller.ts 2>/dev/null
mv src/controllers/category.controller.ts src/controllers/category_controller.ts 2>/dev/null
mv src/controllers/upload.controller.ts src/controllers/upload_controller.ts 2>/dev/null

# 2. Aggiorna gli import in TUTTI i file .ts
echo "📝 Aggiorno gli import..."

# Sostituisci .helpers con _helpers
find src -type f -name "*.ts" -exec sed -i 's/recipe\.helpers/recipe_helpers/g' {} \;

# Sostituisci .queries con _queries
find src -type f -name "*.ts" -exec sed -i 's/recipe\.queries/recipe_queries/g' {} \;

# Sostituisci .validators con _validators
find src -type f -name "*.ts" -exec sed -i 's/recipe\.validators/recipe_validators/g' {} \;

# Sostituisci .service con _service (per i file specifici)
find src -type f -name "*.ts" -exec sed -i 's/session\.service/session_service/g' {} \;
find src -type f -name "*.ts" -exec sed -i 's/user\.service/user_service/g' {} \;
find src -type f -name "*.ts" -exec sed -i 's/email\.service/email_service/g' {} \;

# Sostituisci .controller con _controller (per i file specifici)
find src -type f -name "*.ts" -exec sed -i 's/comment\.controller/comment_controller/g' {} \;
find src -type f -name "*.ts" -exec sed -i 's/image\.controller/image_controller/g' {} \;
find src -type f -name "*.ts" -exec sed -i 's/like\.controller/like_controller/g' {} \;
find src -type f -name "*.ts" -exec sed -i 's/category\.controller/category_controller/g' {} \;
find src -type f -name "*.ts" -exec sed -i 's/upload\.controller/upload_controller/g' {} \;

echo "✅ Fatto! Ora esegui 'npm run dev' per verificare."
