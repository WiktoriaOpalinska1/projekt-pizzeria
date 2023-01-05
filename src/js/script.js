/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input[name="amount"]',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 0,
      defaultMax: 10,
    }
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
  };

  class Product{

    constructor(id, data){
      const thisProduct = this;

      thisProduct.id = id,
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
      //console.log('New Product: ', thisProduct);
    }

    renderInMenu(){
      const thisProduct = this;

      /* Generate HTML based on template*/
      const generatedHTML = templates.menuProduct(thisProduct.data);
      /* Create element using utils.createElementFromHTML */
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      /* Find menu container */
      const menuContainer = document.querySelector(select.containerOf.menu);
      /* Add element to menu */
      menuContainer.appendChild(thisProduct.element); 
    }

    getElements(){
      const thisProduct = this;
    
      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);

      /*console.log('thisProduct.form: ', thisProduct.form);
      console.log('thisProduct.formInputs: ', thisProduct.formInputs);
      console.log('thisProduct.cartButton: ', thisProduct.cartButton);
      console.log('thisProduct.priceElem: ', thisProduct.priceElem ); */

    }

    initAccordion(){
      const thisProduct = this;
      //console.log('thisProduct.element:' , thisProduct.element);

      /* Start: add event listener to clickable trigger on event click;
        Prevent default action for event;
        Find the active product;
        If there is active product and it's not thisProduct.element remove class active from it;
        Toogle active class on thisProduct.element.
      */
      thisProduct.accordionTrigger.addEventListener('click', function(event){
        
        event.preventDefault();

        const activeProducts = document.querySelector(select.all.menuProductsActive);

        if(activeProducts){
          if (activeProducts != thisProduct.element){
            activeProducts.classList.remove('active');
          }
        } 

        thisProduct.element.classList.toggle('active');
      });
    }

    initOrderForm(){
      const thisProduct = this;
      //console.log('initOrderForm: ', thisProduct);

      /* Add event Listnerer to submit button and prevent default action */
      thisProduct.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });

      /* For each checkbox add event listener */
      for(let input of thisProduct.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }

      /*For cart button prevent default action and add event listener*/
      thisProduct.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
    }

    processOrder(){
      const thisProduct = this;
      //console.log('processOrder: ', thisProduct);

      /* Covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']};
        Set price to default price */
      const formData = utils.serializeFormToObject(thisProduct.form);
      //console.log('Form data: ', formData);

      let price = thisProduct.data.price;

      /* For every category (param)... 
      /* Determine param value e.g. paramId = 'toppings', param = {label: 'Toppings', type: 'checkboxes'...} */

      for(let paramId in thisProduct.data.params){
        const param = thisProduct.data.params[paramId];
        //console.log(paramId, param);

        /* For every option in this category 
        Determine option value, e.g. optionId = 'olives', option={label: 'Olives', price: 2, default: true} */
        for(let optionId in param.options){ 
          
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

          const option = param.options[optionId]; 
          //console.log(optionId, option);

          /* Check if there is a param with a name of paramId in formData and if it includes optionId;
            Check if the option is not default && Rise price 
            Check if the option is default  &&  Reduce price*/
          if(optionSelected){
            if (!option.hasOwnProperty('default')){
              price += option['price'];
            }
          } else {
            if (option['default']==true){
              price -= option['price'];
            } 
          }

          /* Find image with .paramId-optionId class; 
            Check if it was found;
            If it was found, check if the option is clicked. If yes, show image. If not, hide image  */

          const optionImage = thisProduct.imageWrapper.querySelector( '.'+ paramId + '-' + optionId);
          //console.log('optionImage: ', optionImage); 

          if (optionImage){
            if (optionSelected){
              optionImage.classList.add(classNames.menuProduct.imageVisible);
            } else {
              optionImage.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
        }
      }

      /* Multiply price by amount */
      price *= thisProduct.amountWidget.value;

      /* Update calcualted price in the HTML */
      thisProduct.priceElem.innerHTML = price;
    }

    initAmountWidget(){
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function(){thisProduct.processOrder();});
    }
  }

  class AmountWidget{
    
    constructor(element){
      const thisWidget = this;
      
      console.log('Amount widget: ', thisWidget);
      console.log('constructir arguments: ', element);

      thisWidget.getElements(element);
      thisWidget.setValue(settings.amountWidget.defaultValue);
      thisWidget.initActions();
    }

    getElements(element){
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease =  thisWidget.element.querySelector(select.widgets.amount.linkIncrease);

    }

    setValue(value){
      const thisWidget = this;
      const newValue = parseInt(value);
      
      
      /* To do: add validation */
      
      if (newValue !== thisWidget.value && !isNaN(newValue) 
      && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax){
        thisWidget.value = newValue;
      }
      thisWidget.announce();
      thisWidget.input.value = thisWidget.value;
    }

    initActions(){
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function(){
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value -1);
      });
      thisWidget.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value +1);
      });
    }

    announce(){
      const thisWidget = this;
      const event = new Event('updated');
      thisWidget.element.dispatchEvent(event);
    }

  }
  const app = {

    initMenu: function(){
      const thisApp = this;
      //console.log('thisApp.data: ', thisApp.data);


      for(let productData in thisApp.data.products){
        new Product(productData, thisApp.data.products[productData]);
      }
    },

    initData: function(){
      const thisApp = this;
      thisApp.data = dataSource;
    },

    init: function(){
      const thisApp = this;
      //console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      thisApp.initData();
      thisApp.initMenu();
    },
  };

  app.init();
}
