// Ana sayfa — login'e yönlendir
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/login');
}
