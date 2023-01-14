/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
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
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };
  
  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };
  
  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
  };
  
  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END
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
        thisProduct.addToCart();
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
      /* Create new value for single price*/ 
      thisProduct.priceSingle = price;

      /* Multiply price by amount */
      price *= thisProduct.amountWidget.value;
      
      thisProduct.price = price;
      /* Update calcualted price in the HTML */
      thisProduct.priceElem.innerHTML = price;
    }

    initAmountWidget(){
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function(){thisProduct.processOrder();});
    }

    prepareCartProduct(){
      const thisProduct = this;
      
      const productSummary = {
        id: thisProduct.id,
        name: thisProduct.data.name,
        amount: thisProduct.amountWidget.value,
        priceSingle: thisProduct.priceSingle,
        price: thisProduct.price,
        params: thisProduct.prepareCartProductParams()
      };

      return productSummary;
    }

    prepareCartProductParams(){
      const thisProduct = this;

      const params = {};

      /* Covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}; */
      const formData = utils.serializeFormToObject(thisProduct.form);
   
      /* For every category(param) determine param value e.g. paramId = 'toppings', param = {label: 'Toppings', type: 'checkboxes'...} */
      for(let paramId in thisProduct.data.params){
        const param = thisProduct.data.params[paramId];
        
        params[paramId] = {
          label: param.label,
          options: {}
        };

        /*For every option in this category determine option value,e.g. optionId = 'olives', option={label: 'Olives', price: 2, default: true}*/
        for(let optionId in param.options){  
          const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
          const option = param.options[optionId];
          
          if(optionSelected){
            params[paramId].options[optionId] = option.label;
          }
        }
      }  
      
      return params;
    }

    addToCart(){
      const thisProduct = this;
     
      app.cart.add(thisProduct.prepareCartProduct());
    }
  }

  class AmountWidget{
    
    constructor(element){
      const thisWidget = this;
      
      //console.log('Amount widget: ', thisWidget);
      //console.log('constructir arguments: ', element);

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

  class Cart{
    
    constructor(element){
      const thisCart = this;
      thisCart.products = [];

      thisCart.getElements(element);
      thisCart.initActions();
      //console.log('new Cart: ', thisCart);
    }

    getElements(element){
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);

      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    }

    initActions(){
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', function(){
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
    }

    add(menuProduct){
      const thisCart = this;
      console.log('adding product: ', menuProduct);

      /* Generate HTML based on template*/
      const generatedHTML = templates.cartProduct(menuProduct);
      /* Create element using utils.createElementFromHTML */
      const generateDOM = utils.createDOMFromHTML(generatedHTML);
      /* Add element to menu */
      thisCart.dom.productList.appendChild(generateDOM); 
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
      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.products;
      fetch(url)
        .then(function(rawResponse){
          return rawResponse.json();
        })
        .then(function(parsedResponse){
          console.log('parsedResponse:', parsedResponse);
          /* Save parsedResponse as thisApp.data.products */
          thisApp.data.products = parsedResponse;
          /* Execute initMenu method */
          thisApp.initMenu();
        });
      console.log('thisApp.data', JSON.stringify(thisApp.data));
    },

    init: function(){
      const thisApp = this;
      //console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      thisApp.initData();
      thisApp.initCart();
    },

    initCart: function(){
      const thisApp = this;
      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },
  };

  app.init();
}
