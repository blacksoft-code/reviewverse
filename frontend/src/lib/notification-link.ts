import type { AppNotification } from '../services/notification.service';

// Business-এর notification গুলো (post/review/follower...) click করলে user-এর
// public UI-তে না গিয়ে সরাসরি business-এর নিজের dashboard-এর সঠিক tab-এ যাবে।
// (পুরনো notification-এর link-ও এখানে ঠিক হয়ে যায়, কারণ link এখানেই বানানো হয়)
export function getNotificationHref(
  n: AppNotification,
): string | null {
  const entityId = n.entityId;

  if (entityId) {
    const dashboard = `/business/${entityId}`;

    switch (n.type) {
      case 'NEW_REVIEW':
        return `${dashboard}?tab=reviews${
          n.reviewId ? `&reviewId=${n.reviewId}` : ''
        }`;

      case 'POST_REACTION':
      case 'POST_COMMENT':
      case 'POST_REPLY':
        return `${dashboard}?tab=posts${
          n.postId ? `&postId=${n.postId}` : ''
        }`;

      case 'NEW_ENTITY_FOLLOWER':
      case 'CLAIM_APPROVED':
        return `${dashboard}?tab=overview`;

      // QUESTION_ASKED / ENTITY_COMMENT_REPLY-এর link backend থেকেই
      // dashboard-এর আসে; CLAIM_REJECTED-এ user-এর business access নেই
      default:
        break;
    }
  }

  return n.link;
}
