import validUrl from 'valid-url';
import fs from 'fs';
import type { NextFunction, Request, Response } from 'express';
import type { Body } from '@tiktofiy/common';
import {
  getTikTokAudioURL,
  getTikTokFinalURL,
  recognizeAudio,
  downloadAudio,
  cutAudio,
  convertAudio,
} from '../services/audio.service';
import { isSongFound } from '@tiktofiy/common';
import { isNodeEnv } from '../config';
import { clearMedia, generateRandomString, returnPath } from '../utils';
import { getStoredTiktok, storeTiktok } from '../services/db.service';
import { InvalidUrlError } from '../errors';

export const audioRecognition = async (req: Request, res: Response, next: NextFunction) => {
  const { url, shazamApiKey, start, end }: Body = req.body;
  if (!validUrl.isUri(url)) {
    return next(new InvalidUrlError('Provide a valid url'));
  }

  try {
    const finalUrl = await getTikTokFinalURL(url);
    const audioUrl = await getTikTokAudioURL(finalUrl);

    if (!isNodeEnv('testing')) {
      const storedTiktok = await getStoredTiktok(audioUrl);
      if (storedTiktok) {
        return res.status(200).send({
          found: true,
          artist: storedTiktok.artist,
          title: storedTiktok.title,
          albumImage: storedTiktok.albumImage,
        });
      }
    }

    const audioFilename = generateRandomString(16);
    const cutAudioFilename = generateRandomString(16);
    const cutConvertedAudioFilename = generateRandomString(16);

    await downloadAudio(audioUrl, audioFilename);
    await cutAudio(audioFilename, cutAudioFilename, start, end);
    await convertAudio(cutAudioFilename, cutConvertedAudioFilename);

    const audioBase64 = fs.readFileSync(returnPath(`${cutConvertedAudioFilename}.mp3`), {
      encoding: 'base64',
    });
    const recognizedAudio = await recognizeAudio(audioBase64, shazamApiKey);

    // If the song has been recognized, save it to the database
    if (!isNodeEnv('testing') && isSongFound(recognizedAudio)) {
      await storeTiktok({
        url: audioUrl,
        artist: recognizedAudio.artist,
        title: recognizedAudio.title,
        albumImage: recognizedAudio.albumImage,
      });
    }

    await clearMedia([audioFilename, cutAudioFilename, cutConvertedAudioFilename]);

    return res.status(200).send(recognizedAudio);
  } catch (err) {
    return next(err);
  }
};
