import xgboost as xgb
import numpy as np
import csv, math
import matplotlib.pyplot as plt
from pandas import read_csv, DataFrame
from sklearn.model_selection import train_test_split, cross_val_score, RepeatedKFold, cross_val_predict
from sklearn.metrics import mean_squared_error, accuracy_score
from sklearn.preprocessing import LabelEncoder,OneHotEncoder, MinMaxScaler
from sklearn.compose import ColumnTransformer

dataframe = read_csv('datos.csv', header=None)
data = dataframe.values
X = data[:, :-1]
Y = data[:, -1]

man = MinMaxScaler()
t = [('num', man, [1,2,3,6,7,10,12,13]), ('cat', OneHotEncoder(), [0,4,5,8,9,11,14,15])]
transformer = ColumnTransformer(transformers=t)
X = transformer.fit_transform(X)

label_encoder = LabelEncoder()
Y = label_encoder.fit_transform(Y)

xtrain, xtest, ytrain, ytest=train_test_split(X,Y, test_size=0.33)

xgbr = xgb.XGBRegressor()

eval_set = [(xtest,ytest)]
xgbr.fit(xtrain, ytrain,eval_metric='rmse', eval_set=eval_set, early_stopping_rounds=10, verbose=False)
#xgb.plot_importance(xgbr)
#plt.show()

importance = xgbr.feature_importances_
# summarize feature importance
for i,v in enumerate(importance):
	print('Feature: %0d, Score: %.5f' % (i,v))
# plot feature importance
plt.bar([x for x in range(len(importance))], importance)
plt.show()

score = xgbr.score(xtrain, ytrain)
print("Training score: %.2f%%" % (score * 100.0))
tscore = xgbr.score(xtest, ytest)
print("Test score: %.2f%%" % (tscore * 100.0))

cv = RepeatedKFold(n_splits=10, n_repeats=3, random_state=1)
# evaluate model
scores = cross_val_score(xgbr, xtrain, ytrain, scoring='neg_mean_absolute_error', cv=cv, n_jobs=-1)
# force scores to be positive
scores = np.absolute(scores)
print('Mean MAE: %.3f (%.3f)' % (scores.mean(), scores.std()) )

ypred = xgbr.predict(xtest)

mse = mean_squared_error(ytest, ypred)
rmse = mean_squared_error(ytest, ypred, squared=False)
print("MSE: %.2f" % mse)
print("RMSE: %.2f" % rmse)

predictions = [round(value) for value in ypred]
# evaluate predictions
accuracy = accuracy_score(ytest, predictions)
print("Accuracy: %.2f%%" % (accuracy * 100.0))

metrics = [['TrainingScore', 'TestScore', 'MAE','STD','MES', 'RMSE', 'Acuraccy'],
           [score,tscore,scores.mean(),scores.std(),mse,rmse,accuracy]]

with open('metrics.csv', 'w+', newline='') as file:
    writer = csv.writer(file)
    writer.writerows(metrics)

#Nivel de obesidad predicho
predictions2 = []
for i in range(0, len(ypred)):
    if ypred[i] > 0:
        predictions2.append(math.floor(ypred[i]))
    else:
        predictions2.append(math.ceil(ypred[i]))

NObesity = label_encoder.inverse_transform(predictions2)
results = [['Data','Test','Predicted','Error','NObesity']]
error = []
for i in range(0, ytest.shape[0]):
    error.append(abs(ytest[i]-ypred[i]))
    results.append([i,ytest[i],ypred[i],error[i],NObesity[i]])

with open('results.csv', 'w+', newline='') as file:
    writer = csv.writer(file)
    writer.writerows(results)
