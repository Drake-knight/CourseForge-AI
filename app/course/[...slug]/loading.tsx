import { Loader2 } from "lucide-react";
import React from "react";

const LoadingComponent: React.FC = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <Loader2 className="animate-spin w-10 h-10" />
  </div>
);

export default LoadingComponent;
