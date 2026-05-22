import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { TodoPage } from './pages/TodoPage';
import { BlogPage } from './pages/BlogPage';
import { WorkoutPage } from './pages/WorkoutPage';

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<TodoPage />} />
        <Route path="/workout" element={<WorkoutPage />} />
        <Route path="/blog" element={<BlogPage />} />
      </Routes>
    </div>
  );
}

export default App;
