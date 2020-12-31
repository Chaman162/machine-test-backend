"use strict";

class Services{
    static async saveData(model,data){
        try {
            let saveData = new model(data).save();
            return Promise.resolve(saveData);
        }
        catch (err) {
            return Promise.reject(err)
        }
    }

    static async getData(model, query, projection, options) {
          try {
            let findData = await model.find(query, projection, options);
            return Promise.resolve(findData);
          } catch (err) {
            return Promise.reject(err);
          }
    }

    static async getDataOne(model, query, projection, options) {
          try {
            let findData = await model.findOne(query, projection, options);
            return Promise.resolve(findData);
          } catch (err) {
            return Promise.reject(err);
          }
      }

      static async getCount(model, query) {
        try {
          let countData = await model.count(query);
          return Promise.resolve(countData);
        } catch (err) {
          return Promise.reject(err);
        }
    }


      static async findAndUpdate(model, conditions, update, options) {
          try {
            let data =await model.findOneAndUpdate(conditions, update, options);
            return Promise.resolve(data);
          } catch (err) {
            return Promise.reject(err);
          }
      }
      
}

module.exports=Services;