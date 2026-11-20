import HomeSections from '@/components/HomeSections';
import { getSettings } from '@/lib/data';

export default async function Home() {
  const settings = await getSettings();
  return <HomeSections settings={settings} />;
}
