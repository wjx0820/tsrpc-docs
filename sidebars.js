/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

module.exports = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  docsSidebar: [{ type: 'autogenerated', dirName: 'docs' }],
  apiSidebar: [{ type: 'autogenerated', dirName: 'api' }],
  cookbookSidebar: [{ type: 'autogenerated', dirName: 'cookbook' }],

  // But you can create a sidebar manually
  /*
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Tutorial',
      items: ['hello'],
    },
  ],
   */
};
