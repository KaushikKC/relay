import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = "button",
  className = "",
  disabled = false,
}) => {
  return (
    <div className="inline-block">
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`relative px-6 md:px-8 py-4 md:py-4 text-base md:text-lg font-bold text-white bg-transparent border-none cursor-pointer rounded-[50px] overflow-hidden transition-transform duration-200 ease-in-out hover:scale-[1.03] active:scale-[0.99] group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 touch-manipulation min-h-[48px] md:min-h-[44px] ${className}`}
      >
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] -z-20 blur-[10px] transition-transform duration-[1.5s] ease-in-out rotate-0 group-hover:rotate-180 bg-[conic-gradient(from_0deg,#ff6b6b,#4ecdc4,#45b7d1,#96ceb4,#feca57,#ff9ff3,#ff6b6b)]" />

        <div className="absolute inset-[3px] bg-black rounded-[47px] -z-10 blur-[5px]" />

        <span className="text-transparent bg-clip-text bg-[conic-gradient(from_0deg,#ff6b6b,#4ecdc4,#45b7d1,#96ceb4,#feca57,#ff9ff3,#ff6b6b)] group-hover:animate-[hue-rotate_2s_linear_infinite]">
          {children}
        </span>
      </button>
    </div>
  );
};

export default Button;
