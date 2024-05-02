from pong.models import *

def	insertSort(tab):
	for i in range(1, len(tab)):
		key = tab[i]
		j = i - 1
		while j >= 0 and tab[j] < key:
			tab[j + 1] = tab[j]
			j -= 1
		tab[j + 1] = key
	return tab
