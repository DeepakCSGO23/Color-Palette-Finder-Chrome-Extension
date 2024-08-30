const textColorOccurance=new Map()
const backgroundColorOccurance=new Map()
const cssVariables=new Map()
const scrapeClassNames =async () => {
    // To store all the elements which has the link to another stylesheet
    const allExternalStyleSheet=[]
    // Getting HTML Elements with class & style attribute
    // [] = select element with that attribute , just element name = select that HTML Element
    // Selecting all HTML elements with rel attribute equals stylesheet
    const elements = document.querySelectorAll('[style],link[rel="stylesheet"],style');
    elements.forEach(element => {
        // Filtering data using the callback function
        // Split only if the elements classname is of type string
        // When you encounter SVG it will return and SVGAnimatedString Object which contains both the base value and the current animated value and it is a Object containing that two keys
        // * For Internal css
        if(element.tagName.toLowerCase()==='style'){
            scrapeInternalCSS(element.textContent,element)
        }

        // * This is for extracting all css property inside the style attribute (Inline css)
        // Since every html element has style property even if it doesnt has the style attribute
        // check if the html element has style attribute 
        if (element.hasAttribute('style')) {
            const inlineTextColor=element.style.color;
            const inlineBackgroundColor=element.style.backgroundColor;
            // There is a inline text color property used
            if(inlineTextColor){
                let area=element.offsetWidth*element.offsetHeight
                if(textColorOccurance.has(inlineTextColor)){
                    const areaTillNow=textColorOccurance.get(inlineTextColor)
                    textColorOccurance.set(inlineTextColor,areaTillNow+area)
                }
                else{
                    textColorOccurance.set(inlineTextColor,1)
                }
            }
            // There is a inline background color property used
            if(inlineBackgroundColor){
                let area=element.offsetWidth*element.offsetHeight
                if(backgroundColorOccurance.has(inlineBackgroundColor)){
                    const areaTillNow=backgroundColorOccurance.get(inlineBackgroundColor)
                    backgroundColorOccurance.set(inlineBackgroundColor,areaTillNow+area)
                }
                else{
                    backgroundColorOccurance.set(inlineBackgroundColor,area)
                }
            }
        }
        //* Scrapping data from the external css file
        if(element.tagName.toLowerCase()==='link'&&element.getAttribute('rel')==='stylesheet'){
            allExternalStyleSheet.push(element)
        }
    });

    // This starts the scrapping data from the external css files
    if(allExternalStyleSheet){
        const result=await scrapFromExternalCSS(allExternalStyleSheet) 
        return result
    }
    return;
    // To perform array operations on map convert map to array first 
    // Cannot send Map directly so converting map to array since map object is not directly serializable to JSON which can cause issues when sending data between scripts.Chrome's messaging API expects data to be serializable
};
// When a message hits scrapper.js from the popup.js it calls the scrapeClassNames function and scraps all the classnames
// Since chrome has the info about the person sends the message we can just send the scrapped data to the sender i.e to popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'fetchData') {
        scrapeClassNames().then((data) => {
            const sortedTextColorOccurance=[...data.textColorOccurance.entries()].sort((a,b)=>b[1]-a[1])
            const sortedBackgroundColorOccurance=[...data.backgroundColorOccurance.entries()].sort((a,b)=>b[1]-a[1])
            sendResponse({ data: {sortedTextColorOccurance,sortedBackgroundColorOccurance},cssVariables:Array.from(cssVariables) });
        });
        return true; // Indicates that we want to send a response asynchronously
    }
});

// * Internal css - just send the css text to postcss server for scrapping
const scrapeInternalCSS=async(cssText,element)=>{
    const response=await fetch('https://css-scrapping-server.onrender.com/parse-css',{
        method:'POST',body:cssText
    })
    const text=JSON.parse(await response.text())
    console.log(element,text)
    // after finding all the class name with color property and all the css variables its time to find the area of the html element with color property in the html document
    text.classColors.forEach((item)=>{
        const classNames=item[0]
        const textColor=item[1].color
        const backgroundColor=item[1].backgroundColor
        const allHTMLElements=document.querySelectorAll(classNames)
        allHTMLElements.forEach((element)=>{
            // element , elements area , text color and its background color
            let area=element.offsetWidth*element.offsetHeight            
            if(textColor){
                if(textColorOccurance.has(textColor)){
                    let areaTillNow=textColorOccurance.get(textColor)
                    textColorOccurance.set(textColor,areaTillNow+area)
                }
                else{
                    textColorOccurance.set(textColor,area)
                }
            }
            if(backgroundColor){
                if(backgroundColorOccurance.has(backgroundColor)){
                    let areaTillNow=backgroundColorOccurance.get(backgroundColor)
                    backgroundColorOccurance.set(backgroundColor,areaTillNow+area)
                }
                else{
                    backgroundColorOccurance.set(backgroundColor,area)
                }
            }
        })
        
    })
}


// * External css - first get the css text then parse to text to get the css file first
const scrapFromExternalCSS = async (allExternalStyleSheets) => {
    console.log('here',allExternalStyleSheets)
    for(let i=0;i<allExternalStyleSheets.length;i++){
        const url=allExternalStyleSheets[i].href
        const response=await fetch(url)
        const cssText=await response.text()
        const response2=await fetch('https://css-scrapping-server.onrender.com/parse-css',{
            method:'POST',body:cssText
        })
        
        const text= await response2.text()
        const textInJson=JSON.parse(text)
        const propertiesInTheClassName=textInJson.classColors
        textInJson.cssVariables.forEach((variable)=>{
            cssVariables.set(variable[0],variable[1])
        })
        
        // Find all html elements with the class name to find its impact
        propertiesInTheClassName.forEach((item)=>{
            const className=item[0]
            const textColor=item[1].color
            const backgroundColor=item[1].backgroundColor
            try{
                const htmlElement=document.querySelectorAll(className)
                // Travers all html element and increment its area
            htmlElement.forEach((element)=>{
                let area=element.offsetHeight*element.offsetWidth
                if(textColor){
                    if(textColorOccurance.has(textColor)){
                        let areaTillNow=textColorOccurance.get(textColor)
                        textColorOccurance.set(textColor,areaTillNow+area)
                    }
                    else{
                        textColorOccurance.set(textColor,area)
                    }
                }
                if(backgroundColor){
                    if(backgroundColorOccurance.has(backgroundColor)){
                        let areaTillNow=backgroundColorOccurance.get(backgroundColor)
                        backgroundColorOccurance.set(backgroundColor,areaTillNow+area)
                    }
                    else{
                        backgroundColorOccurance.set(backgroundColor,area)
                    }
                }
            })
            }
            catch(err){
                console.log("No element with that classname",err)
            }
        })
    }
    return {textColorOccurance,backgroundColorOccurance}
};


