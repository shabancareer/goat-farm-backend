import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Enable CORS
  app.enableCors();
  const port = process.env.PORT || 3001;
  await app.listen(port);
  // console.log('\n' + '='.repeat(50));
  // console.log('🚀 GOAT FARMING API SERVER');
  // console.log('='.repeat(50));
  // console.log(`📡 Server running on: http://localhost:${port}`);
  // console.log(`📝 API Endpoints:`);
  // console.log(`   POST   http://localhost:${port}/goats  - Create new goat`);
  // console.log(`   GET    http://localhost:${port}/allgoats  - List all goats`);
  // console.log(`   GET    http://localhost:${port}/api/goats/:id - Get goat by ID`);
  // console.log('='.repeat(50) + '\n');
}
bootstrap();
