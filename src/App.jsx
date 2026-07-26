import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import Navbar from './components/Navbar';
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Navbar />
      <main className="min-h-screen  pt-16 text-black">
        <section className="mx-auto max-w-7xl px-6 py-10">
          页面主体内容
        </section>
      </main>
    </>
  );
}

export default App
