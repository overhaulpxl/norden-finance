import { prisma } from './prisma';
import {
  FALLBACK_PUBLIC_TESTIMONIALS,
  clampPublicRating,
  isPublicSafeFeedback,
  type PublicTestimonial,
} from './landingFallbacks';

export async function getPublicTestimonials(): Promise<PublicTestimonial[]> {
  try {
    const feedbacks = await prisma.feedback.findMany({
      where: {
        status: { in: ['reviewed', 'open'] },
      },
      orderBy: [
        { rating: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 12,
      select: {
        userId: true,
        rating: true,
        message: true,
      },
    });

    const publicFeedbacks = feedbacks.filter((feedback) => isPublicSafeFeedback(feedback.message));
    if (publicFeedbacks.length === 0) {
      return FALLBACK_PUBLIC_TESTIMONIALS;
    }

    const userIds = Array.from(
      new Set(
        publicFeedbacks
          .map((feedback) => feedback.userId)
          .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
      )
    );

    const feedbackProfiles = userIds.length > 0
      ? await prisma.profile.findMany({
          where: { userId: { in: userIds } },
          select: { userId: true, fullName: true },
        })
      : [];

    const feedbackProfileMap = new Map(
      feedbackProfiles.map((feedbackProfile) => [feedbackProfile.userId, feedbackProfile.fullName])
    );

    const publicTestimonials = publicFeedbacks.map((feedback) => ({
      name: feedbackProfileMap.get(feedback.userId)?.trim() || 'Pengguna Norden',
      label: 'Pengguna Terverifikasi',
      rating: clampPublicRating(feedback.rating),
      message: feedback.message,
    }));

    return publicTestimonials.length > 0 ? publicTestimonials : FALLBACK_PUBLIC_TESTIMONIALS;
  } catch (error) {
    console.error('Failed to load public testimonials from DB:', error);
    return FALLBACK_PUBLIC_TESTIMONIALS;
  }
}
