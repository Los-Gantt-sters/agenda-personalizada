import { BrowserRouter, Routes, Route } from "react-router-dom";
import Inicio from "./pantallas/Inicio";
import Login from "./pantallas/Login";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
