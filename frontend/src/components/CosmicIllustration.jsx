const spaceImage = '';

export function CosmicIllustration() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Space illustration background */}
      <img 
        src={spaceImage} 
        alt="Space nebula with planets"
        className="absolute inset-0 w-full h-full object-cover object-left"
      />
      
      {/* Dark gradient overlay - transparent left to dark right */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[rgba(5,3,24,0.65)]" />
    </div>
  );
}