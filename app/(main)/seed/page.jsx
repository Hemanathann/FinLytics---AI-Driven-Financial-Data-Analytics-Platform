/**
 * /seed — Demo Data Loader
 *
 * HOW TO ACCESS: visit /seed on your deployed site
 *
 * WHAT IT DOES: Seeds 6 months of realistic Irish transactions
 * into your first account to showcase every analytics feature.
 *
 * WHY IT EXISTS: Recruiters won't upload their own bank statement.
 * This gives them a fully-populated dashboard in one click.
 */

import { SeedPage } from "./_components/seed-page";

export default function Seed() {
  return <SeedPage />;
}