import express from 'express';
import MediaItem from '../model/mediaItem.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

function normalizeMediaItem(item) {
  const obj = item.toObject();
  return {
    ...obj,
    id: obj._id,
  };
}

function extractYouTubeVideoId(url) {
  try {
    const parsedUrl = new URL(url);
    const watchId = parsedUrl.searchParams.get('v');
    if (watchId) {
      return watchId;
    }

    const segments = parsedUrl.pathname.split('/').filter(Boolean);
    const embedIndex = segments.indexOf('embed');
    if (embedIndex >= 0 && segments[embedIndex + 1]) {
      return segments[embedIndex + 1];
    }

    if (parsedUrl.hostname.includes('youtu.be') && segments[0]) {
      return segments[0];
    }

    return segments.at(-1) || '';
  } catch {
    return '';
  }
}

function buildThumbnailUrl(videoUrl) {
  const videoId = extractYouTubeVideoId(videoUrl);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
}

router.get('/', async (req, res) => {
  try {
    const filter = req.query.type ? { type: req.query.type } : {};
    const mediaItems = await MediaItem.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(mediaItems.map(normalizeMediaItem));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to load media items' });
  }
});

router.post('/live', adminAuth, async (req, res) => {
  try {
    const { title, streamer, status, embedUrl, thumbnail } = req.body;

    if (!title || !streamer || !embedUrl) {
      return res.status(400).json({
        message: 'Title, streamer and embed URL are required',
      });
    }

    const mediaItem = new MediaItem({
      type: 'live',
      title,
      streamer,
      viewers: '',
      status,
      embedUrl,
      thumbnail: thumbnail || buildThumbnailUrl(embedUrl),
    });
    await mediaItem.save();

    return res.status(201).json(normalizeMediaItem(mediaItem));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to create live video' });
  }
});

router.post('/highlights', adminAuth, async (req, res) => {
  try {
    const { title, category, published, thumbnail, videoUrl, embedUrl } = req.body;
    const resolvedEmbedUrl = embedUrl || videoUrl;

    if (!title || !category || !published || !resolvedEmbedUrl) {
      return res.status(400).json({
        message: 'Title, category, published date and embed URL are required',
      });
    }

    const mediaItem = new MediaItem({
      type: 'highlight',
      title,
      category,
      duration: '',
      published,
      thumbnail: thumbnail || buildThumbnailUrl(resolvedEmbedUrl),
      embedUrl: resolvedEmbedUrl,
    });
    await mediaItem.save();

    return res.status(201).json(normalizeMediaItem(mediaItem));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to create highlight' });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const mediaItem = await MediaItem.findById(req.params.id);
    if (!mediaItem) {
      return res.status(404).json({ message: 'Media item not found' });
    }

    const { title, streamer, status, embedUrl, category, published, videoUrl } = req.body;
    const resolvedEmbedUrl = embedUrl || videoUrl;

    if (title !== undefined) mediaItem.title = title;
    if (streamer !== undefined) mediaItem.streamer = streamer;
    if (status !== undefined) mediaItem.status = status;
    if (category !== undefined) mediaItem.category = category;
    if (published !== undefined) mediaItem.published = published;
    if (resolvedEmbedUrl !== undefined) {
      mediaItem.embedUrl = resolvedEmbedUrl;
      mediaItem.thumbnail = buildThumbnailUrl(resolvedEmbedUrl);
    }

    await mediaItem.save();
    return res.status(200).json(normalizeMediaItem(mediaItem));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update media item' });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const removed = await MediaItem.findByIdAndDelete(req.params.id);
    if (!removed) {
      return res.status(404).json({ message: 'Media item not found' });
    }

    return res.status(200).json({ message: 'Media item deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to delete media item' });
  }
});

export default router;
