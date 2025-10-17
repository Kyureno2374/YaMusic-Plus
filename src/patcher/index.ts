#!/usr/bin/env node

import { getLatestBuild } from './core/yandex-api';
import { BuildProcessor } from './core/build-processor';
import { ROOT_DIR } from '@config/paths';

async function main() {
  console.log('YaMusic Plus Patcher');
  console.log('====================\n');

  console.log('Получение информации о последней версии...\n');

  const result = await getLatestBuild();

  if (result.isErr()) {
    console.error('❌ Ошибка:', result.error.message);
    process.exit(1);
  }

  const builds = result.value;

  if (builds.length === 0) {
    console.error('❌ Не найдено доступных сборок');
    process.exit(1);
  }

  console.log(`Найдено сборок: ${builds.length}\n`);

  const processor = new BuildProcessor(ROOT_DIR);

  for (const build of builds) {
    console.log(`\n📦 Обработка сборки ${build.version}`);
    console.log(`Размер: ${(build.size / 1024 / 1024).toFixed(2)} MB\n`);

    try {
      await processor.process(build);
    } catch (error) {
      console.error(`❌ Ошибка обработки: ${(error as Error).message}`);
      process.exit(1);
    }
  }

  console.log('\n🎉 Все сборки успешно обработаны!');
}

main();
