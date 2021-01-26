const helper = {
  /**
   * true if field is missing. false otherwise
   *
   * @param {*} field
   */
  isFieldMissing: (field: any) => {
    return typeof field === 'undefined' || field === null;
  },
};

export default helper;
