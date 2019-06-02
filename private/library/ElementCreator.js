/*
 Copyright 2017 Carmilla Mina Jankovic

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

const mouseHandler = require('./MouseHandler');
const textTools = require('./TextTools');

const cssClasses = {
  emptyInput: 'emptyInput',
  clickable: 'clickable',
};
// const glitchClasses = [
//   'fastGlitch',
//   'slowGlitch',
//   'normalGlitch',
// ];

/**
 * Set an Id on the element.
 * @param {HTMLElement} element Element to add an Id to.
 * @param {string} id Id to add.
 */
function setElementId(element, id) {
  if (id) {
    element.setAttribute('id', id);
  }
}

/**
 * Set a name on the element.
 * @param {HTMLElement} element Element to add a name to.
 * @param {string} name Name to add.
 */
function setName(element, name) {
  if (name) {
    element.setAttribute('name', name);
  }
}

/**
 * Set classes on the element.
 * @param {HTMLElement} element Element to add classes to.
 * @param {string[]} classes Classes to add.
 */
function setClasses(element, classes = []) {
  classes.forEach(cssClass => element.classList.add(cssClass));
}

/**
 * Set click listeners on the element.
 * @param {HTMLElement} element Element to add click listeners to.
 * @param {Object} clickFuncs Functions to call on clicks.
 * @param {Function} clickFuncs.leftFunc Function that is called on left click.
 * @param {Function} clickFuncs.right Function that is called on right click.
 */
function setClickFuncs(element, clickFuncs) {
  if (clickFuncs && (clickFuncs.leftFunc || clickFuncs.right)) {
    const params = clickFuncs;
    params.element = element;

    mouseHandler.addClickListener(params);

    element.classList.add(cssClasses.clickable);
  }
}

/**
 * Create an element and set the set parameters.
 * @param {Object} params Parameters.
 * @param {string} params.elementType Type of element to create.
 * @param {string} [params.elementId] Id of the element.
 * @param {string[]} [params.classes] CSS classes.
 * @param {Function} [params.clickFuncs] Functions called on clicks.
 * @param {string} [params.name] Name of the element.
 * @return {HTMLElement} The created element.
 */
function createBaseElement({
  elementId,
  classes,
  elementType,
  clickFuncs,
  name,
}) {
  const element = document.createElement(elementType);

  setClasses(element, classes);
  setElementId(element, elementId);
  setClickFuncs(element, clickFuncs);
  setName(element, name);

  return element;
}

class ElementCreator {
  static createList({
    elementId,
    clickFuncs,
    items = [],
    classes = [],
  }) {
    const list = createBaseElement({
      elementId,
      classes,
      clickFuncs,
      elementType: 'ul',
    });

    items.forEach((item) => {
      list.appendChild(this.createListItem(item));
    });

    return list;
  }

  static createPicture({
    picture,
    clickFuncs,
    classes,
    elementId,
    isUploaded = true,
  }) {
    const pictureElement = createBaseElement({
      elementId,
      classes,
      clickFuncs,
      elementType: 'img',
    });
    const path = isUploaded
      ? `/images/upload/${picture.fileName}`
      : `/images/${picture.fileName}`;

    pictureElement.setAttribute('src', path);

    if (picture.width) { pictureElement.setAttribute('style', `${pictureElement.getAttribute('style') || ''} width: ${picture.width}px;`); }
    if (picture.height) { pictureElement.setAttribute('style', `${pictureElement.getAttribute('style') || ''} height: ${picture.height}px;`); }

    return pictureElement;
  }

  static createListItem({
    elements,
    clickFuncs,
    classes,
    elementId,
  }) {
    const listItem = createBaseElement({
      elementId,
      classes,
      clickFuncs,
      elementType: 'li',
    });

    if (elements) {
      elements.forEach(element => listItem.appendChild(element));
    }

    return listItem;
  }

  static createSpan({
    text,
    clickFuncs,
    elementId,
    classes,
    spanType,
    effect,
  }) {
    const span = createBaseElement({
      elementId,
      classes,
      clickFuncs,
      elementType: spanType || 'span',
    });

    if (text) {
      span.appendChild(document.createTextNode(text));
    }

    if (effect && Math.random() > 0.90) {
      const maxLength = text.length > 50
        ? 50
        : text.length;

      span.setAttribute('subMsg', textTools.createGlitchString(maxLength));
      // span.classList.add(glitchClasses[Math.floor(Math.random() * glitchClasses.length)]);
    }

    return span;
  }

  static createButton({
    text,
    clickFuncs,
    elementId,
    classes = [],
  }) {
    const span = this.createSpan({
      classes: classes.concat(['button', 'clickable']),
    });
    const button = createBaseElement({
      elementId,
      clickFuncs,
      classes,
      elementType: 'button',
    });

    button.appendChild(document.createTextNode(text));
    span.appendChild(button);

    return span;
  }

  static createContainer({
    elementId,
    classes,
    elements,
    name,
    clickFuncs,
  }) {
    const container = createBaseElement({
      elementId,
      classes,
      name,
      clickFuncs,
      elementType: 'div',
    });

    if (elements) {
      elements.forEach(element => container.appendChild(element));
    }

    return container;
  }

  /**
   * Create a paragraph element.
   * Setting elements will attach them to the paragraph. Otherwise, text will be used to attach a text node.
   * @param {Object} params Parameters.
   * @param {Object[]} [params.elements] Elements to attach.
   * @param {string} [params.text] Text to add to the paragraph. It is overriden by elements.
   * @param {string[]} [params.classes] Css classes.
   * @return {HTMLElement} Paragraph element.
   */
  static createParagraph({
    elements,
    text,
    clickFuncs,
    classes = [],
  }) {
    const paragraph = createBaseElement({
      classes,
      clickFuncs,
      elementType: 'p',
    });

    if (elements) {
      elements.forEach(element => paragraph.appendChild(element));
    } else {
      paragraph.appendChild(document.createTextNode(text));
    }

    return paragraph;
  }

  static createInput({
    type,
    inputName,
    isRequired,
    multiLine,
    maxLength,
    elementId,
    classes,
    shouldResize,
    text,
    isLocked,
    placeholder = '',
  }) {
    const input = createBaseElement({
      elementId,
      classes,
      name: inputName,
      elementType: multiLine
        ? 'textarea'
        : 'input',
    });

    if (text) {
      if (multiLine) {
        input.value = text.join('\n').replace(/''/g, '\n');
      } else {
        const [value] = text;

        if (value) {
          input.value = value;
        }
      }
    } else {
      input.setAttribute('placeholder', placeholder);
    }

    if (maxLength) { input.setAttribute('maxlength', maxLength); }

    if (type) {
      input.setAttribute('type', type);
    } else {
      input.setAttribute('type', 'text');
    }

    if (isRequired) {
      input.addEventListener('blur', () => {
        if (input.value === '') { input.classList.add(cssClasses.emptyInput); }
      });
      input.setAttribute('required', 'true');
    }

    if (isRequired || (multiLine && shouldResize)) {
      input.addEventListener('input', () => {
        if (isRequired) {
          input.classList.remove(cssClasses.emptyInput);
        }

        if (multiLine && shouldResize) {
          input.style.height = 'auto';
          input.style.height = `${input.scrollHeight}px`;
        }
      });
    }

    if (isLocked) {
      input.setAttribute('readonly', 'true');
    }

    return input;
  }

  static createImageInput({
    inputName,
    elementId,
    classes,
    previewId = 'imagePreview',
    previewContainer = document.createElement('img'),
    appendPreview = false,
  }) {
    const container = this.createContainer({
      classes,
      elementId,
      name: inputName,
    });
    const imageInput = document.createElement('input');
    imageInput.classList.add('hide');
    imageInput.setAttribute('type', 'file');
    imageInput.setAttribute('accept', 'image/png, image/jpeg, image/pjpeg');
    imageInput.addEventListener('change', () => {
      const file = imageInput.files[0];
      const reader = new FileReader();

      reader.addEventListener('load', () => {
        previewContainer.classList.remove('hide');
        previewContainer.setAttribute('src', reader.result);
        previewContainer.setAttribute('name', file.name);
      });

      reader.readAsDataURL(file);
    });

    previewContainer.setAttribute('id', previewId);

    container.appendChild(this.createButton({
      text: 'Image',
      clickFuncs: {
        leftFunc: () => {
          imageInput.click();
        },
      },
    }));

    if (appendPreview) {
      previewContainer.classList.add('hide');
      container.appendChild(previewContainer);
    }

    return container;
  }

  static createHeader({
    elements,
    clickFuncs,
    classes,
  }) {
    const header = createBaseElement({
      clickFuncs,
      classes,
      elementType: 'header',
    });

    if (elements) {
      elements.forEach(element => header.appendChild(element));
    }

    return header;
  }

  static createArticle({
    classes,
    elements,
    footerElement,
    headerElement,
    elementId,
  }) {
    const article = createBaseElement({
      elementId,
      classes,
      elementType: 'article',
    });

    if (headerElement) {
      const header = createBaseElement({ elementType: 'header' });

      header.appendChild(headerElement);
      article.appendChild(header);
    }

    if (elements) {
      elements.forEach(element => article.appendChild(element));
    }

    if (footerElement) {
      const footer = createBaseElement({ elementType: 'footer' });

      footer.appendChild(footerElement);
      article.appendChild(footer);
    }

    return article;
  }

  static createSection({
    classes,
    elements,
    footerElement,
    headerElement,
    elementId,
  }) {
    const section = createBaseElement({
      elementId,
      classes,
      elementType: 'section',
    });

    if (headerElement) {
      const header = createBaseElement({ elementType: 'header' });

      header.appendChild(headerElement);
      section.appendChild(header);
    }

    if (elements) {
      elements.forEach(element => section.appendChild(element));
    }

    if (footerElement) {
      const footer = createBaseElement({ elementType: 'footer' });

      footer.appendChild(footerElement);
      section.appendChild(footer);
    }

    return section;
  }

  static createRadioSet({
    classes,
    elementId,
    title,
    optionName,
    options = [],
  }) {
    const fieldset = createBaseElement({
      elementId,
      classes,
      elementType: 'fieldset',
    });
    const legend = document.createElement('legend');

    legend.appendChild(document.createTextNode(title));
    fieldset.appendChild(legend);

    options.forEach((option) => {
      const {
        optionId,
        value,
        isDefault,
        optionLabel,
      } = option;
      const inputLabel = document.createElement('label');
      const input = document.createElement('input');

      inputLabel.setAttribute('for', optionId);
      input.setAttribute('type', 'radio');
      input.setAttribute('id', optionId);
      input.setAttribute('name', optionName);
      input.setAttribute('value', value);

      if (isDefault) {
        input.setAttribute('checked', 'true');
      }

      inputLabel.appendChild(input);
      inputLabel.appendChild(document.createElement('span'));
      inputLabel.appendChild(document.createTextNode(optionLabel));
      fieldset.appendChild(inputLabel);
    });

    return fieldset;
  }

  static createSelect({
    name,
    classes,
    elementId,
    multiple,
    options = [],
  }) {
    const select = createBaseElement({
      elementId,
      classes,
      name,
      elementType: 'select',
    });

    if (multiple) {
      select.setAttribute('multiple', 'true');
    }

    options.forEach((option) => {
      const optionElement = document.createElement('option');

      optionElement.setAttribute('value', option.value);
      optionElement.innerText = option.name;

      select.appendChild(optionElement);
    });

    return select;
  }

  static replaceFirstChild(parentElement, newChild) {
    if (parentElement.firstElementChild) {
      parentElement.replaceChild(newChild, parentElement.firstElementChild);
    } else {
      parentElement.appendChild(newChild);
    }
  }
}

module.exports = ElementCreator;
