import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, NavLink, useNavigate } from "react-router-dom";
import React from "react";
import { useAuth, useAdminAuth } from "@/context/authContext";
import { motion } from "framer-motion";
import { LayoutDashboardIcon, LogOutIcon } from "lucide-react";
import { btnPrimaryGiggles, gigglesPublicShell } from "@/lib/giggles-classes";
import { cn, getInitialsFromName } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { isLoggedIn, user, logout } = useAuth();
  const { isAdminLoggedIn, admin, adminLogout } = useAdminAuth();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [openUserMenu, setOpenUserMenu] = React.useState(false);
  const navigate = useNavigate();
  const dashboardPath = isAdminLoggedIn ? "/admin/dashboard" : "/dashboard";
  const userLabel = isAdminLoggedIn ? "Admin" : "User";
  const avatarInitials =
    isAdminLoggedIn && admin
      ? getInitialsFromName(undefined, undefined, admin.name, admin.email)
      : user
        ? getInitialsFromName(user.firstName, user.lastName, null, user.email)
        : "?";
  const avatarClassName = "h-10 w-10 border border-[#e8e8ec]";

  const handleLogout = () => {
    setOpenMobile(false);
    if (isAdminLoggedIn) {
      adminLogout();
      navigate("/admin/login"); // ✅ call admin logout if admin is logged in
    }
    logout();
    navigate("/"); // ✅ redirect to home after logout
  };

  React.useEffect(() => {
    console.log("Navbar isLoggedIn:", isLoggedIn);
    console.log("Navbar isAdminLoggedIn:", isAdminLoggedIn);
  }, [isLoggedIn, isAdminLoggedIn]);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "rounded-full px-4 py-2 text-sm font-semibold font-['Manrope',system-ui,sans-serif] transition-colors",
      isActive
        ? "text-[#006a3d] underline decoration-2 decoration-[#006a3d] underline-offset-[10px]"
        : "text-[#2d2f31] hover:text-[#006a3d]",
    );

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-[100] w-full border-b border-[#e8e8ec]/90 bg-[#ffffff]/90 shadow-[0_8px_32px_rgba(45,47,49,0.05)] backdrop-blur-[16px]"
    >
      <div
        className={cn(
          gigglesPublicShell,
          "flex h-20 items-center justify-between gap-3 md:gap-4"
        )}
      >
      {/* Logo */}
      <div>
        <Link to="/" className="flex items-center">
          <img
            src="/logo.png"
            alt="Giggles Foundation logo"
            className="w-32 md:w-40"
          />
          <span className="sr-only">Giggles Foundation</span>
        </Link>
      </div>

      {/* Mobile Menu */}
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden">
            <MenuIcon className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <div className="flex items-center pb-2 gap-4 border-b border-gray-300">
            <img
              src="/logo.png"
              alt="Giggles Foundation logo"
              className="w-1/2"
            />
          </div>

          <nav className="flex flex-col p-4 pb-12 h-full justify-between">
            <div className="flex flex-col gap-2">
              {["Home", "About", "Cases", "Gallery", "Vision", "Contact"].map(
                (item) => (
                  <NavLink
                    key={item}
                    to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                    className={({ isActive }) =>
                      cn("py-2 text-lg font-semibold", navClass({ isActive }))
                    }
                    onClick={() => setOpenMobile(false)}
                  >
                    {item}
                  </NavLink>
                ),
              )}
              <Link to="/donate" onClick={() => setOpenMobile(false)}>
                <Button
                  type="button"
                  className={cn(btnPrimaryGiggles, "mt-3 w-full py-3 text-sm")}
                >
                  Donate
                </Button>
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex flex-row items-center mb-4">
              {isLoggedIn || isAdminLoggedIn ? (
                <div className="flex flex-row justify-between items-center w-full">
                  <Link
                    to={isAdminLoggedIn ? "/admin/dashboard" : "/dashboard"}
                    className="w-full"
                    onClick={() => setOpenMobile(false)}
                  >
                    <Avatar className={avatarClassName}>
                      <AvatarFallback className="rounded-full bg-[#e8f5ee] text-sm font-bold text-[#006a3d]">
                        {avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <Link
                    to={isAdminLoggedIn ? "/admin/dashboard" : "/dashboard"}
                    className="w-full flex justify-center"
                    onClick={() => setOpenMobile(false)}
                  >
                    <Button type="button" variant="outline" className="text-sm">
                      Dashboard
                    </Button>
                  </Link>
                  <Link
                    to="#" // Changed to '#' to prevent direct navigation, handle via onClick
                    onClick={handleLogout}
                    className="w-full flex justify-end"
                    aria-label="logout"
                  >
                    <svg
                      fill="#000000"
                      height="30px"
                      width="30px"
                      version="1.1"
                      id="Capa_1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 384.971 384.971"
                    >
                      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                      <g
                        id="SVGRepo_tracerCarrier"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></g>
                      <g id="SVGRepo_iconCarrier">
                        {" "}
                        <g>
                          {" "}
                          <g id="Sign_Out">
                            {" "}
                            <path d="M180.455,360.91H24.061V24.061h156.394c6.641,0,12.03-5.39,12.03-12.03s-5.39-12.03-12.03-12.03H12.03 C5.39,0.001,0,5.39,0,12.031V372.94c0,6.641,5.39,12.03,12.03,12.03h168.424c6.641,0,12.03-5.39,12.03-12.03 C192.485,366.299,187.095,360.91,180.455,360.91z"></path>{" "}
                            <path d="M381.481,184.088l-83.009-84.2c-4.704-4.752-12.319-4.74-17.011,0c-4.704,4.74-4.704,12.439,0,17.179l62.558,63.46H96.279 c-6.641,0-12.03,5.438-12.03,12.151c0,6.713,5.39,12.151,12.03,12.151h247.74l-62.558,63.46c-4.704,4.752-4.704,12.439,0,17.179 c4.704,4.752,12.319,4.752,17.011,0l82.997-84.2C386.113,196.588,386.161,188.756,381.481,184.088z"></path>{" "}
                          </g>{" "}
                          <g> </g> <g> </g> <g> </g> <g> </g> <g> </g>{" "}
                          <g> </g>{" "}
                        </g>{" "}
                      </g>
                    </svg>
                  </Link>
                </div>
              ) : (
                <Link to="/login" className="w-full">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-base font-semibold text-[#006a3d] hover:bg-[#f0f0f3]"
                  >
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Desktop Menu */}
      <nav className="hidden items-center gap-1 lg:flex xl:gap-2">
        {["Home", "About", "Cases", "Gallery", "Vision", "Contact"].map(
          (item) => (
            <NavLink
              key={item}
              to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
              className={navClass}
            >
              {item}
            </NavLink>
          ),
        )}
      </nav>

      {/* Auth Buttons (Desktop) */}
      <div className="hidden lg:flex gap-4 items-center">
        {isLoggedIn || isAdminLoggedIn ? (
          <DropdownMenu open={openUserMenu} onOpenChange={setOpenUserMenu}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onMouseEnter={() => setOpenUserMenu(true)}
              >
                <Avatar className={avatarClassName}>
                  <AvatarFallback className="rounded-full bg-[#e8f5ee] text-sm font-bold text-[#006a3d]">
                    {avatarInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-44 rounded-lg"
              sideOffset={8}
              onMouseEnter={() => setOpenUserMenu(true)}
              onMouseLeave={() => setOpenUserMenu(false)}
            >
              <DropdownMenuLabel>{userLabel} Menu</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link
                  to={dashboardPath}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <LayoutDashboardIcon className="size-4 shrink-0" strokeWidth={2} />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOutIcon className="size-4 shrink-0" strokeWidth={2} />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            to="/login"
            className="text-sm font-semibold text-[#006a3d] underline-offset-4 hover:underline"
          >
            Login
          </Link>
        )}
        <Link to="/donate">
          <Button
            type="button"
            className={cn(btnPrimaryGiggles, "px-7 py-2.5 text-sm")}
          >
            Donate
          </Button>
        </Link>
      </div>
      </div>
    </motion.header>
  );
}

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}
