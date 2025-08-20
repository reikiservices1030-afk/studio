import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    // This function now safely checks for the window object.
    const checkDevice = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    // Initial check on the client-side after mount.
    checkDevice();

    // Add resize listener
    window.addEventListener("resize", checkDevice);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  return isMobile;
}
