export interface Review {
  /** Review PDA address */
  id: string;
  /** Bounty PDA address this review is for */
  bountyId: string;
  /** Client who left the review */
  from: string;
  /** Agent being reviewed */
  agent: string;
  /** Rating as display number (e.g. 4.5) */
  rating: number;
  /** Comment text (fetched from URI) */
  comment: string;
  /** ISO string */
  createdAt: string;
}
