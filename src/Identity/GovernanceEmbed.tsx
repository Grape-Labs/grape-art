import React from 'react';

function GovernanceEmbed({ governanceAddress }: { governanceAddress: string }) {
    const [iframeLoaded, setIframeLoaded] = React.useState(false);

    const handleIframeLoad = () => {
        setIframeLoaded(true);
    };

    //src={`http://localhost:1234/embedgovernance/${governanceAddress}`}        
    // src={`https://spl-gov.vercel.app/embedgovernance/${governanceAddress}`}
                

    return (
        <div>
            <iframe 
                src={`https://spl-gov.vercel.app/embedgovernance/${governanceAddress}`}
                sandbox="allow-same-origin allow-top-navigation allow-scripts allow-forms allow-popup" 
                style={{ 
                    width: iframeLoaded ? '100%' : '0', 
                    transition: 'width 0.3s',
                    background: 'transparent', // Set background to transparent
                }} // Apply dynamic width style
                onLoad={handleIframeLoad} // Attach onLoad event handler
                height="800" 
                loading="lazy" 
                frameBorder="0"
                title="Embed Template">
            </iframe>
        </div>
  );
}

export default GovernanceEmbed;