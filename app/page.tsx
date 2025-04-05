

export default function Home() {
  return (
    <div className="relative min-h-screen pt-32 pb-0 sm:pt-40">
      {/* Enhanced Gradient Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900 via-purple-800 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-purple-600 via-purple-900 to-transparent" />
        <div className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_0%,_#3b0764,_#0c0a09_25%,_#0c0a09_75%,_#3b0764_100%)] opacity-50" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6">
          Boost your
          <br />
          preparation <span className="text-purple-400">with AI.</span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-300 mb-8">
          Elevate your preparation effortlessly with AI, where smart technology meets user-friendly course planning.
        </p>



      </div>
    </div>
  );
}
