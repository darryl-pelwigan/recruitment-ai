import { useEffect, useState } from 'react'
import './App.css'
import { api } from './api/api'

function App() {
  useEffect(() => {
    api.get("/")
      .then(res => console.log(res.data));
  }, []);

  return <div className="text-xl">Recruitment AI System</div>;
}

export default App
