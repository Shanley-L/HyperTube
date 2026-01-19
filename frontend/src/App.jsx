import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="app">
        <header>
          <h1>HyperTube</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<div>Home Page</div>} />
          </Routes>
        </main>
        <footer>
          <p>HyperTube - 42 Project</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
