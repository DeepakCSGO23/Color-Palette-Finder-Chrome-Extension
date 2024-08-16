chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // Sends message to scrapper so that the scrapper scraps the web page
    // Flow goes to scrapper.js

    // First we ensure that the content script is injected
    chrome.scripting.executeScript({
        target:{tabId:tabs[0].id},
        files:['scrapper.js']
    },()=>{
        // This function executes after the scrapper.js completes executing fully
        // After the script is injected , send the message to start the data scraping process
        chrome.tabs.sendMessage(tabs[0].id, { action: 'fetchData' }, 
            // When scrapper.js completes executing the response is handled i.e scrapped data is pushed to the popup html
            (response) => {

            // Get the DOM elements
            const primaryTextColorNode = document.getElementById('primary-text-color');
            const secondaryTextColorNode = document.getElementById('secondary-text-color');
            const primaryBackgroundColorNode = document.getElementById('primary-background-color');
            const secondaryBackgroundColorNode = document.getElementById('secondary-background-color');
            // if response is undefined just do this and return from the program flow
            if(!response.data){
                // Update the text content of each DOM element
                primaryTextColorNode.textContent = `No Color Found!`;
                secondaryTextColorNode.textContent = `No Color Found!`;
                primaryBackgroundColorNode.textContent = `No Color Found!`;
                secondaryBackgroundColorNode.textContent = `No Color Found!`;
                return;
            }

            // There is some response so ofcourse there is some data in it so extract the data key from response
            const data =response.data || [];
            const textColorData=data.sortedTextColorOccurance
            const backgroundColorData=data.sortedBackgroundColorOccurance

            // CSS variable map
            const cssVariables=new Map(response.cssVariables)
            console.log(cssVariables.keys())
            //textcolordata has var(--yt-spec-text-primary)
            // textColorData.forEach((color)=>{
            //   // this is not a color but a css variable name so replace it
            //   if(color[0].startsWith('var')){
            //     // extract variable name 
            //     const variable=
               
            //   }
            // })
            

            // Use conditional (ternary) operator to set default values
            const primaryTextColor = textColorData[0] && textColorData[0][0] ? textColorData[0][0] : "No Color Detected";
            const secondaryTextColor = textColorData[1] && textColorData[1][0] ? textColorData[1][0] : "No Color Detected";
            const primaryBackgroundColor = backgroundColorData[0] && backgroundColorData[0][0] ? backgroundColorData[0][0] : "No Color Detected";
            const secondaryBackgroundColor = backgroundColorData[1] && backgroundColorData[1][0] ? backgroundColorData[1][0] : "No Color Detected";
    
            // Update the text content of each DOM element
            primaryTextColorNode.textContent = primaryTextColor;
            secondaryTextColorNode.textContent = secondaryTextColor;
            primaryBackgroundColorNode.textContent = primaryBackgroundColor;
            secondaryBackgroundColorNode.textContent = secondaryBackgroundColor;
            
            // Creating a Sample to show users what is the color used visually rather than by text
            for(let i=0;i<4;i++){
                createColorSample(document.createElement('div'))
            }
            
        });
    })
});
// A function to create a Sample to show users what is the color used visually rather than by text
const createColorSample=(element)=>{
    element.style.height="20px"
    element.style.width='20px'
    element.style.backgroundColor='#3dba5f'
    element.style.borderRadius="50px"
    document.body.appendChild(element)
}
