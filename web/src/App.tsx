import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Auth } from "@/components/Auth";
import { PublicDashboard } from "@/components/PublicDashboard";
import { AdminDashboard } from "@/components/AdminDashboard";
import { Toaster } from "@/components/ui/sonner";
import { FloatingNav } from "@/components/FloatingNav";

import { TooltipProvider } from "@/components/ui/tooltip";

function App() {
	const [user, setUser] = useState<any>(null);

	// Check for existing session (mocked)
	useEffect(() => {
		const savedUser = localStorage.getItem("nexus_user");
		if (savedUser) {
			setUser(JSON.parse(savedUser));
		}
	}, []);

	const handleLogin = (u: any) => {
		setUser(u);
		localStorage.setItem("nexus_user", JSON.stringify(u));
	};

	const handleLogout = () => {
		setUser(null);
		localStorage.removeItem("nexus_user");
	};

	return (
		<TooltipProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<PublicDashboard />} />
					<Route 
						path="/auth" 
						element={user ? <Navigate to="/admin" /> : <Auth onLogin={handleLogin} />} 
					/>
					<Route 
						path="/admin" 
						element={user ? <AdminDashboard onLogout={handleLogout} /> : <Navigate to="/auth" />} 
					/>
				</Routes>
				<FloatingNav />
				<Toaster position="top-right" />
			</BrowserRouter>
		</TooltipProvider>
	);
}

export default App;
