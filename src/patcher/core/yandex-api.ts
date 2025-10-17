import axios from 'axios';
import yaml from 'js-yaml';
import { z } from 'zod';
import { ok, err, Result } from 'neverthrow';
import fs from 'fs';

const UPDATE_DOMAIN = 'https://music-desktop-application.s3.yandex.net';

const UpdateInfoSchema = z.object({
  files: z.array(
    z.object({
      url: z.string(),
      sha512: z.string(),
      size: z.number(),
    })
  ),
  releaseDate: z.string().optional(),
  updateProbability: z.number().optional(),
  version: z.string(),
  commonConfig: z.object({
    DEPRECATED_VERSIONS: z.string().optional(),
  }),
});

export interface BuildInfo {
  path: string;
  hash: string;
  size: number;
  version: string;
  releaseDate?: string;
}

export async function getLatestBuild(): Promise<Result<BuildInfo[], Error>> {
  try {
    const response = await axios.get(`${UPDATE_DOMAIN}/stable/latest.yml`, {
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const rawInfo = yaml.load(response.data);
    const parseResult = UpdateInfoSchema.safeParse(rawInfo);

    if (!parseResult.success) {
      return err(parseResult.error);
    }

    const info = parseResult.data;
    const builds = info.files.map((file) => ({
      path: file.url,
      hash: file.sha512,
      size: file.size,
      releaseDate: info.releaseDate,
      version: info.version,
    }));

    return ok(builds);
  } catch (error) {
    return err(error as Error);
  }
}

export async function downloadBuild(
  build: BuildInfo,
  outputPath: string
): Promise<Result<void, Error>> {
  try {
    const response = await axios.get(`${UPDATE_DOMAIN}/stable/${build.path}`, {
      responseType: 'arraybuffer',
    });

    fs.writeFileSync(outputPath, Buffer.from(response.data));
    return ok(undefined);
  } catch (error) {
    return err(error as Error);
  }
}

